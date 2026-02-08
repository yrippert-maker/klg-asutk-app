/**
 * API endpoint для работы с задачами Jira
 * Данные импортируются из CSV файлов в папке "новая папка"
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database/connection';
import { getRateLimitIdentifier } from '@/lib/rate-limit';
import { rateLimit } from '@/lib/rate-limit';
import { handleError } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = rateLimit(getRateLimitIdentifier(request));
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов' },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.resetTime) } }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'epic', 'story', 'subtask', 'all'
    const epicId = searchParams.get('epic_id');
    const storyId = searchParams.get('story_id');

    const client = await pool.connect();
    try {
      let result;

      if (type === 'epic' || !type) {
        // Получаем все эпики
        const epicsResult = await client.query(
          `SELECT 
            issue_id as "issueId",
            summary,
            description,
            priority,
            components,
            labels,
            created_at as "createdAt",
            updated_at as "updatedAt"
           FROM jira_epics
           ORDER BY 
             CASE priority 
               WHEN 'High' THEN 1 
               WHEN 'Medium' THEN 2 
               WHEN 'Low' THEN 3 
               ELSE 4 
             END,
             created_at DESC`
        );

        // Для каждого эпика получаем связанные истории
        for (const epic of epicsResult.rows) {
          const storiesResult = await client.query(
            `SELECT 
              issue_id as "issueId",
              summary,
              description,
              priority,
              story_points as "storyPoints",
              components,
              labels,
              acceptance_criteria as "acceptanceCriteria",
              created_at as "createdAt"
             FROM jira_stories
             WHERE parent_epic_id = $1
             ORDER BY priority DESC, story_points DESC`,
            [epic.issueId]
          );

          epic.stories = storiesResult.rows;

          // Для каждой истории получаем подзадачи
          for (const story of epic.stories) {
            const subtasksResult = await client.query(
              `SELECT 
                issue_id as "issueId",
                summary,
                description,
                priority,
                components,
                labels,
                created_at as "createdAt"
               FROM jira_subtasks
               WHERE parent_story_id = $1
               ORDER BY priority DESC`,
              [story.issueId]
            );

            story.subtasks = subtasksResult.rows;
          }
        }

        result = epicsResult.rows;
      } else if (type === 'story') {
        const query = epicId
          ? `SELECT * FROM jira_stories WHERE parent_epic_id = $1 ORDER BY priority DESC, story_points DESC`
          : `SELECT * FROM jira_stories ORDER BY priority DESC, story_points DESC`;
        const params = epicId ? [epicId] : [];
        result = (await client.query(query, params)).rows;
      } else if (type === 'subtask') {
        const query = storyId
          ? `SELECT * FROM jira_subtasks WHERE parent_story_id = $1 ORDER BY priority DESC`
          : `SELECT * FROM jira_subtasks ORDER BY priority DESC`;
        const params = storyId ? [storyId] : [];
        result = (await client.query(query, params)).rows;
      } else {
        // Все задачи
        const [epics, stories, subtasks] = await Promise.all([
          client.query('SELECT * FROM jira_epics ORDER BY priority DESC'),
          client.query('SELECT * FROM jira_stories ORDER BY priority DESC, story_points DESC'),
          client.query('SELECT * FROM jira_subtasks ORDER BY priority DESC'),
        ]);

        result = {
          epics: epics.rows,
          stories: stories.rows,
          subtasks: subtasks.rows,
        };
      }

      // Получаем зависимости
      const dependenciesResult = await client.query(
        `SELECT 
          from_issue_id as "fromIssueId",
          to_issue_id as "toIssueId",
          link_type as "linkType"
         FROM jira_task_dependencies
         ORDER BY created_at DESC`
      );

      return NextResponse.json({
        data: result,
        dependencies: dependenciesResult.rows,
        meta: {
          total: Array.isArray(result) ? result.length : Object.keys(result).length,
          type: type || 'epic',
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    return handleError(error, {
      path: '/api/jira-tasks',
      method: 'GET',
    });
  }
}
