/**
 * Unit тесты для валидации данных
 */
import { describe, it, expect } from '@jest/globals';
import { aircraftSchema, riskSchema, organizationSchema } from '@/lib/validation';

describe('Validation Schemas', () => {
  describe('aircraftSchema', () => {
    it('должен валидировать корректные данные ВС', () => {
      const validData = {
        registrationNumber: 'RA-12345',
        serialNumber: 'SN-001',
        aircraftType: 'Boeing 737-800',
        operator: 'Аэрофлот',
        status: 'Активен' as const,
        flightHours: 12500,
      };

      expect(() => aircraftSchema.parse(validData)).not.toThrow();
    });

    it('должен отклонять неверный формат регистрационного номера', () => {
      const invalidData = {
        registrationNumber: '12345', // Неверный формат
        serialNumber: 'SN-001',
        aircraftType: 'Boeing 737-800',
        operator: 'Аэрофлот',
        status: 'Активен' as const,
      };

      expect(() => aircraftSchema.parse(invalidData)).toThrow();
    });

    it('должен отклонять неверный статус', () => {
      const invalidData = {
        registrationNumber: 'RA-12345',
        serialNumber: 'SN-001',
        aircraftType: 'Boeing 737-800',
        operator: 'Аэрофлот',
        status: 'Неверный статус', // Неверный статус
      };

      expect(() => aircraftSchema.parse(invalidData)).toThrow();
    });

    it('должен отклонять отрицательный налет', () => {
      const invalidData = {
        registrationNumber: 'RA-12345',
        serialNumber: 'SN-001',
        aircraftType: 'Boeing 737-800',
        operator: 'Аэрофлот',
        status: 'Активен' as const,
        flightHours: -100, // Отрицательное значение
      };

      expect(() => aircraftSchema.parse(invalidData)).toThrow();
    });
  });

  describe('riskSchema', () => {
    it('должен валидировать корректные данные риска', () => {
      const validData = {
        title: 'Высокий износ двигателя',
        level: 'Высокий' as const,
        category: 'Техническое состояние',
        aircraft: 'RA-12345',
        status: 'Требует внимания',
      };

      expect(() => riskSchema.parse(validData)).not.toThrow();
    });

    it('должен отклонять неверный уровень риска', () => {
      const invalidData = {
        title: 'Риск',
        level: 'Неверный уровень' as any,
        category: 'Категория',
        aircraft: 'RA-12345',
        status: 'Статус',
      };

      expect(() => riskSchema.parse(invalidData)).toThrow();
    });
  });

  describe('organizationSchema', () => {
    it('должен валидировать корректные данные организации', () => {
      const validData = {
        name: 'Аэрофлот',
        type: 'Авиакомпания',
        status: 'Активна',
        aircraftCount: 150,
      };

      expect(() => organizationSchema.parse(validData)).not.toThrow();
    });

    it('должен отклонять пустое название', () => {
      const invalidData = {
        name: '', // Пустое название
        type: 'Авиакомпания',
        status: 'Активна',
      };

      expect(() => organizationSchema.parse(invalidData)).toThrow();
    });
  });
});
