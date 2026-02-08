/**
 * Unit тесты для санитизации данных
 */
import { describe, it, expect } from '@jest/globals';
import { sanitizeText, sanitizeHtml, sanitizeUrl } from '@/lib/sanitize';

describe('Sanitization Functions', () => {
  describe('sanitizeText', () => {
    it('должен удалять угловые скобки', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeText(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('должен обрезать пробелы', () => {
      const input = '  текст  ';
      const result = sanitizeText(input);
      expect(result).toBe('текст');
    });
  });

  describe('sanitizeHtml', () => {
    it('должен удалять опасные теги', () => {
      const input = '<script>alert("xss")</script><p>Безопасный текст</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>');
    });

    it('должен разрешать безопасные теги', () => {
      const input = '<b>Жирный</b> <i>Курсив</i>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<b>');
      expect(result).toContain('<i>');
    });
  });

  describe('sanitizeUrl', () => {
    it('должен валидировать корректные HTTP URL', () => {
      const input = 'https://example.com';
      const result = sanitizeUrl(input);
      expect(result).toBe('https://example.com/');
    });

    it('должен отклонять javascript: URL', () => {
      const input = 'javascript:alert("xss")';
      const result = sanitizeUrl(input);
      expect(result).toBeNull();
    });

    it('должен отклонять неверные протоколы', () => {
      const input = 'file:///etc/passwd';
      const result = sanitizeUrl(input);
      expect(result).toBeNull();
    });
  });
});
