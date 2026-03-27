'use client';

const FormField = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  error = '',
  required = false,
  placeholder = '',
  disabled = false,
  readOnly = false,
  options = [],
  rows = 4,
  min,
  max,
  step,
  pattern,
  className = '',
  helperText = '',
  icon: Icon = null,
}) => {
  const hasError = Boolean(error);
  const baseClasses =
    'w-full px-3 py-2 border rounded-lg text-sm transition-all focus:outline-none';
  const borderClasses = hasError
    ? 'border-red-500 focus:ring-2 focus:ring-red-500'
    : 'border-secondary-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500';
  const disabledClasses = disabled
    ? 'bg-secondary-100 cursor-not-allowed opacity-60'
    : 'bg-white';

  const inputClasses = `${baseClasses} ${borderClasses} ${disabledClasses} ${className}`;

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-500 pointer-events-none" size={18} />
        )}

        {type === 'select' ? (
          <select
            name={name}
            value={value || ''}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            className={`${inputClasses} ${Icon ? 'pl-10' : ''}`}
          >
            <option value="">{placeholder || 'Select...'}</option>
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            name={name}
            value={value || ''}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            rows={rows}
            className={`${inputClasses} resize-vertical ${Icon ? 'pl-10' : ''}`}
          />
        ) : type === 'checkbox' ? (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name={name}
              checked={value || false}
              onChange={onChange}
              onBlur={onBlur}
              disabled={disabled}
              className="w-4 h-4 text-primary-600 border-secondary-300 rounded cursor-pointer focus:ring-2 focus:ring-primary-500"
            />
            <label className="text-sm text-secondary-700 cursor-pointer">
              {label}
              {required && <span className="text-red-500">*</span>}
            </label>
          </div>
        ) : type === 'radio' ? (
          <div className="space-y-2">
            {options.map((option) => (
              <div key={option.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={onChange}
                  onBlur={onBlur}
                  disabled={disabled}
                  className="w-4 h-4 text-primary-600 border-secondary-300 cursor-pointer focus:ring-2 focus:ring-primary-500"
                />
                <label className="text-sm text-secondary-700 cursor-pointer">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        ) : (
          <input
            type={type}
            name={name}
            value={value || ''}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            min={min}
            max={max}
            step={step}
            pattern={pattern}
            className={`${inputClasses} ${Icon ? 'pl-10' : ''}`}
          />
        )}
      </div>

      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-secondary-600 text-xs mt-1">{helperText}</p>
      )}
    </div>
  );
};

export default FormField;
