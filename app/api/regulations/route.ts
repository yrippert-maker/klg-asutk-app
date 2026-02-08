export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { RegulationDocument, chicagoConventionAnnexes } from '@/lib/regulations';

// В реальном приложении здесь будет загрузка из базы данных или внешних источников
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    // Мок-данные для демонстрации
    // В реальном приложении здесь будет запрос к базе данных
    let documents: RegulationDocument[] = [
      {
        id: 'chicago-convention',
        title: 'Конвенция о международной гражданской авиации (Chicago Convention)',
        source: 'ICAO',
        type: 'convention',
        category: 'Основополагающий документ',
        version: '2024',
        lastUpdated: new Date().toISOString(),
        content: 'Конвенция о международной гражданской авиации была подписана в Чикаго 7 декабря 1944 года. Это основополагающий документ, который регулирует международную гражданскую авиацию. Конвенция включает 19 приложений, каждое из которых охватывает разные аспекты авиации, такие как безопасность, эксплуатация воздушных судов, сертификация, управление воздушным движением и др.',
        url: 'https://www.icao.int/publications/pages/doc7300.aspx',
        sections: chicagoConventionAnnexes.map(annex => ({
          id: annex.id,
          title: annex.title,
          content: `Содержание ${annex.title}: ${annex.category}`,
        })),
      },
      {
        id: 'icao-annex-8',
        title: 'ICAO Annex 8 - Airworthiness of Aircraft',
        source: 'ICAO',
        type: 'annex',
        category: 'Лётная годность воздушных судов',
        version: '2024',
        lastUpdated: new Date().toISOString(),
        content: 'Annex 8 устанавливает международные стандарты и рекомендуемую практику для лётной годности воздушных судов. Документ определяет минимальные требования к конструкции, производству и эксплуатации воздушных судов.',
        url: 'https://www.icao.int/publications/pages/doc7300.aspx',
      },
      {
        id: 'easa-part-21',
        title: 'EASA Part-21 - Certification of aircraft and related products',
        source: 'EASA',
        type: 'regulation',
        category: 'Сертификация воздушных судов',
        version: '2024',
        lastUpdated: new Date().toISOString(),
        content: 'EASA Part-21 устанавливает требования к сертификации воздушных судов и связанных продуктов, частей и принадлежностей, а также к проектированию и производству организаций.',
        url: 'https://www.easa.europa.eu/en/regulations',
      },
      {
        id: 'easa-part-m',
        title: 'EASA Part-M - Continuing Airworthiness',
        source: 'EASA',
        type: 'regulation',
        category: 'Поддержание лётной годности',
        version: '2024',
        lastUpdated: new Date().toISOString(),
        content: 'EASA Part-M устанавливает требования к поддержанию лётной годности воздушных судов, включая техническое обслуживание, ремонт и модификации.',
        url: 'https://www.easa.europa.eu/en/regulations',
      },
      {
        id: 'faa-part-91',
        title: 'FAA Part 91 - General Operating and Flight Rules',
        source: 'FAA',
        type: 'regulation',
        category: 'Общие правила эксплуатации и полетов',
        version: '2024',
        lastUpdated: new Date().toISOString(),
        content: 'FAA Part 91 устанавливает общие правила эксплуатации и полетов для гражданских воздушных судов в США. Включает требования к сертификации, эксплуатации и техническому обслуживанию.',
        url: 'https://www.faa.gov/regulations_policies',
      },
      {
        id: 'faa-part-43',
        title: 'FAA Part 43 - Maintenance, Preventive Maintenance, Rebuilding, and Alteration',
        source: 'FAA',
        type: 'regulation',
        category: 'Техническое обслуживание',
        version: '2024',
        lastUpdated: new Date().toISOString(),
        content: 'FAA Part 43 устанавливает правила для технического обслуживания, профилактического обслуживания, восстановления и модификации воздушных судов.',
        url: 'https://www.faa.gov/regulations_policies',
      },
      {
        id: 'mak-standards',
        title: 'МАК - Стандарты и правила авиационной безопасности',
        source: 'MAK',
        type: 'regulation',
        category: 'Стандарты безопасности',
        version: '2024',
        lastUpdated: new Date().toISOString(),
        content: 'Межгосударственный авиационный комитет (МАК) разрабатывает и внедряет стандарты и правила авиационной безопасности для стран СНГ. Включает требования к лётной годности, сертификации и эксплуатации воздушных судов.',
        url: 'http://www.mak.ru',
      },
      {
        id: 'mak-certification',
        title: 'МАК - Правила сертификации воздушных судов',
        source: 'MAK',
        type: 'regulation',
        category: 'Сертификация',
        version: '2024',
        lastUpdated: new Date().toISOString(),
        content: 'Правила сертификации воздушных судов МАК устанавливают требования к сертификации типов воздушных судов, их частей и принадлежностей в странах СНГ.',
        url: 'http://www.mak.ru',
      },
      {
        id: 'armac-fap-128',
        title: 'АРМАК - ФАП-128. Требования к лётной годности воздушных судов',
        source: 'ARMAC',
        type: 'rule',
        category: 'Лётная годность',
        version: '2024',
        lastUpdated: new Date().toISOString(),
        content: 'Федеральные авиационные правила устанавливают требования к лётной годности гражданских воздушных судов, их частей и принадлежностей. Определяют минимальные стандарты безопасности для эксплуатации воздушных судов.',
        url: 'https://favt.gov.ru',
      },
      {
        id: 'armac-fap-145',
        title: 'АРМАК - ФАП-145. Требования к организациям по техническому обслуживанию',
        source: 'ARMAC',
        type: 'rule',
        category: 'Техническое обслуживание',
        version: '2024',
        lastUpdated: new Date().toISOString(),
        content: 'ФАП-145 устанавливает требования к организациям, выполняющим техническое обслуживание и ремонт воздушных судов. Определяет стандарты качества и безопасности работ.',
        url: 'https://favt.gov.ru',
      },
      {
        id: 'armac-fap-147',
        title: 'АРМАК - ФАП-147. Требования к учебным организациям',
        source: 'ARMAC',
        type: 'rule',
        category: 'Обучение',
        version: '2024',
        lastUpdated: new Date().toISOString(),
        content: 'ФАП-147 устанавливает требования к учебным организациям, осуществляющим подготовку специалистов по техническому обслуживанию воздушных судов.',
        url: 'https://favt.gov.ru',
      },
      {
        id: 'russian-air-code',
        title: 'Воздушный кодекс Российской Федерации',
        source: 'AIR_CODE',
        type: 'code',
        category: 'Федеральный закон',
        version: '2024',
        lastUpdated: new Date().toISOString(),
        content: 'Воздушный кодекс РФ устанавливает правовые основы использования воздушного пространства Российской Федерации и деятельности в области авиации. Определяет права и обязанности участников авиационной деятельности.',
        url: 'http://www.consultant.ru/document/cons_doc_LAW_137902/',
      },
      {
        id: 'fap-128',
        title: 'ФАП-128. Требования к лётной годности воздушных судов',
        source: 'RUSSIAN_RULES',
        type: 'rule',
        category: 'Лётная годность',
        version: '2024',
        lastUpdated: new Date().toISOString(),
        content: 'Федеральные авиационные правила устанавливают требования к лётной годности гражданских воздушных судов. Определяют минимальные стандарты безопасности для конструкции, производства и эксплуатации воздушных судов.',
      },
      {
        id: 'fap-145',
        title: 'ФАП-145. Требования к организациям по техническому обслуживанию',
        source: 'RUSSIAN_RULES',
        type: 'rule',
        category: 'Техническое обслуживание',
        version: '2024',
        lastUpdated: new Date().toISOString(),
        content: 'ФАП-145 устанавливает требования к организациям, выполняющим техническое обслуживание, ремонт и модификацию воздушных судов. Определяет стандарты качества работ и квалификацию персонала.',
      },
      {
        id: 'fap-147',
        title: 'ФАП-147. Требования к учебным организациям',
        source: 'RUSSIAN_RULES',
        type: 'rule',
        category: 'Обучение',
        version: '2024',
        lastUpdated: new Date().toISOString(),
        content: 'ФАП-147 устанавливает требования к учебным организациям, осуществляющим подготовку и переподготовку специалистов по техническому обслуживанию воздушных судов.',
      },
      {
        id: 'fap-21',
        title: 'ФАП-21. Производство авиационной техники',
        source: 'RUSSIAN_RULES',
        type: 'rule',
        category: 'Производство',
        version: '2024',
        lastUpdated: new Date().toISOString(),
        content: 'ФАП-21 устанавливает требования к производству авиационной техники, включая воздушные суда, их части и принадлежности. Определяет стандарты качества производства.',
      },
      {
        id: 'fap-25',
        title: 'ФАП-25. Нормы лётной годности самолётов транспортной категории',
        source: 'RUSSIAN_RULES',
        type: 'rule',
        category: 'Лётная годность',
        version: '2024',
        lastUpdated: new Date().toISOString(),
        content: 'ФАП-25 устанавливает нормы лётной годности для самолётов транспортной категории. Определяет минимальные требования к конструкции, характеристикам и эксплуатации.',
      },
      {
        id: 'fap-29',
        title: 'ФАП-29. Нормы лётной годности винтокрылых аппаратов',
        source: 'RUSSIAN_RULES',
        type: 'rule',
        category: 'Лётная годность',
        version: '2024',
        lastUpdated: new Date().toISOString(),
        content: 'ФАП-29 устанавливает нормы лётной годности для винтокрылых аппаратов (вертолётов). Определяет требования к конструкции и эксплуатации вертолётов.',
      },
      {
        id: 'fap-39',
        title: 'ФАП-39. Воздушная навигация',
        source: 'RUSSIAN_RULES',
        type: 'rule',
        category: 'Навигация',
        version: '2024',
        lastUpdated: new Date().toISOString(),
        content: 'ФАП-39 устанавливает требования к воздушной навигации, включая навигационное оборудование, процедуры и стандарты.',
      },
      {
        id: 'fap-50',
        title: 'ФАП-50. Требования к аэродромам',
        source: 'RUSSIAN_RULES',
        type: 'rule',
        category: 'Аэродромы',
        version: '2024',
        lastUpdated: new Date().toISOString(),
        content: 'ФАП-50 устанавливает требования к аэродромам, включая инфраструктуру, оборудование и эксплуатацию.',
      },
    ];

    // Фильтрация по источнику
    if (source) {
      documents = documents.filter(doc => doc.source === source);
    }

    // Фильтрация по типу
    if (type) {
      documents = documents.filter(doc => doc.type === type);
    }

    // Поиск
    if (search) {
      const searchLower = search.toLowerCase();
      documents = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchLower) ||
        doc.content.toLowerCase().includes(searchLower) ||
        doc.category.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      documents,
      total: documents.length,
    });
  } catch (error: any) {
    console.error('Ошибка загрузки нормативных документов:', error);
    return NextResponse.json(
      { error: 'Ошибка при загрузке документов', message: error.message },
      { status: 500 }
    );
  }
}
