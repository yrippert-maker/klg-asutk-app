/**
 * Пример использования валидации в форме
 */
'use client';

import { useFormValidation } from '@/hooks/useFormValidation';
import { validateAircraft } from '@/lib/validation/client-validation';
import FormField from '../FormField';
import ValidatedForm from '../ValidatedForm';

export default function ValidatedAircraftForm({ onSave }: { onSave: (data: any) => Promise<void> }) {
  const {
    values,
    errors,
    isSubmitting,
    canSubmit: _canSubmit,
    setValue,
    setFieldTouched,
    getFieldError,
    isFieldTouched,
    handleSubmit,
  } = useFormValidation({
    schema: validateAircraft,
    onSubmit: onSave,
    initialValues: {
      registrationNumber: '',
      serialNumber: '',
      aircraftType: '',
      operator: '',
      status: 'Активен',
    },
  });

  return (
    <ValidatedForm
      onSubmit={handleSubmit}
      validationErrors={errors}
      isSubmitting={isSubmitting}
      submitLabel="Сохранить ВС"
    >
      <FormField
        label="Регистрационный номер"
        name="registrationNumber"
        required
        error={isFieldTouched('registrationNumber') ? getFieldError('registrationNumber') : undefined}
        hint="Формат: RA-XXXXX"
      >
        <input
          type="text"
          name="registrationNumber"
          value={values.registrationNumber || ''}
          onChange={(e) => setValue('registrationNumber', e.target.value)}
          onBlur={() => setFieldTouched('registrationNumber')}
          style={{
            width: '100%',
            padding: '10px',
            border: `1px solid ${getFieldError('registrationNumber') ? '#f44336' : '#ccc'}`,
            borderRadius: '4px',
            fontSize: '14px',
          }}
          placeholder="RA-12345"
        />
      </FormField>

      <FormField
        label="Серийный номер"
        name="serialNumber"
        required
        error={isFieldTouched('serialNumber') ? getFieldError('serialNumber') : undefined}
      >
        <input
          type="text"
          name="serialNumber"
          value={values.serialNumber || ''}
          onChange={(e) => setValue('serialNumber', e.target.value)}
          onBlur={() => setFieldTouched('serialNumber')}
          style={{
            width: '100%',
            padding: '10px',
            border: `1px solid ${getFieldError('serialNumber') ? '#f44336' : '#ccc'}`,
            borderRadius: '4px',
            fontSize: '14px',
          }}
        />
      </FormField>

      <FormField
        label="Тип ВС"
        name="aircraftType"
        required
        error={isFieldTouched('aircraftType') ? getFieldError('aircraftType') : undefined}
      >
        <input
          type="text"
          name="aircraftType"
          value={values.aircraftType || ''}
          onChange={(e) => setValue('aircraftType', e.target.value)}
          onBlur={() => setFieldTouched('aircraftType')}
          style={{
            width: '100%',
            padding: '10px',
            border: `1px solid ${getFieldError('aircraftType') ? '#f44336' : '#ccc'}`,
            borderRadius: '4px',
            fontSize: '14px',
          }}
          placeholder="Boeing 737-800"
        />
      </FormField>

      <FormField
        label="Оператор"
        name="operator"
        required
        error={isFieldTouched('operator') ? getFieldError('operator') : undefined}
      >
        <input
          type="text"
          name="operator"
          value={values.operator || ''}
          onChange={(e) => setValue('operator', e.target.value)}
          onBlur={() => setFieldTouched('operator')}
          style={{
            width: '100%',
            padding: '10px',
            border: `1px solid ${getFieldError('operator') ? '#f44336' : '#ccc'}`,
            borderRadius: '4px',
            fontSize: '14px',
          }}
          placeholder="Аэрофлот"
        />
      </FormField>

      <FormField
        label="Статус"
        name="status"
        required
        error={isFieldTouched('status') ? getFieldError('status') : undefined}
      >
        <select
          name="status"
          value={values.status || 'Активен'}
          onChange={(e) => setValue('status', e.target.value)}
          onBlur={() => setFieldTouched('status')}
          style={{
            width: '100%',
            padding: '10px',
            border: `1px solid ${getFieldError('status') ? '#f44336' : '#ccc'}`,
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          <option value="Активен">Активен</option>
          <option value="На обслуживании">На обслуживании</option>
          <option value="Неактивен">Неактивен</option>
        </select>
      </FormField>
    </ValidatedForm>
  );
}
