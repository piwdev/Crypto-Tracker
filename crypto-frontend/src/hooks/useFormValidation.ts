import { useState, useCallback, useEffect } from 'react';
import { validation, ValidationResult, FieldValidation } from '../utils/validation';

interface UseFormValidationOptions {
  validationRules: FieldValidation;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

interface FormValidationState {
  values: Record<string, string>;
  errors: Record<string, string>;
  warnings: Record<string, string[]>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isValidating: boolean;
}

interface FormValidationActions {
  setValue: (field: string, value: string) => void;
  setValues: (values: Record<string, string>) => void;
  setTouched: (field: string, touched?: boolean) => void;
  setAllTouched: () => void;
  validateField: (field: string) => Promise<ValidationResult>;
  validateForm: () => Promise<boolean>;
  clearErrors: () => void;
  clearError: (field: string) => void;
  reset: (initialValues?: Record<string, string>) => void;
}

export const useFormValidation = (
  initialValues: Record<string, string> = {},
  options: UseFormValidationOptions
): [FormValidationState, FormValidationActions] => {
  const {
    validationRules,
    validateOnChange = false,
    validateOnBlur = true,
    debounceMs = 300,
  } = options;

  const [state, setState] = useState<FormValidationState>({
    values: initialValues,
    errors: {},
    warnings: {},
    touched: {},
    isValid: true,
    isValidating: false,
  });

  // デバウンス用のタイマー
  const [debounceTimers, setDebounceTimers] = useState<Record<string, NodeJS.Timeout>>({});

  // フィールド値を設定
  const setValue = useCallback((field: string, value: string) => {
    setState(prev => ({
      ...prev,
      values: { ...prev.values, [field]: value },
      errors: { ...prev.errors, [field]: '' }, // エラーをクリア
    }));

    // 変更時バリデーションが有効な場合
    if (validateOnChange && validationRules[field]) {
      // 既存のタイマーをクリア
      if (debounceTimers[field]) {
        clearTimeout(debounceTimers[field]);
      }

      // デバウンス付きでバリデーション実行
      const timer = setTimeout(() => {
        validateFieldInternal(field, value);
      }, debounceMs);

      setDebounceTimers(prev => ({ ...prev, [field]: timer }));
    }
  }, [validateOnChange, validationRules, debounceMs, debounceTimers]);

  // 複数のフィールド値を設定
  const setValues = useCallback((values: Record<string, string>) => {
    setState(prev => ({
      ...prev,
      values: { ...prev.values, ...values },
    }));
  }, []);

  // フィールドのタッチ状態を設定
  const setTouched = useCallback((field: string, touched: boolean = true) => {
    setState(prev => ({
      ...prev,
      touched: { ...prev.touched, [field]: touched },
    }));

    // ブラー時バリデーションが有効で、タッチされた場合
    if (validateOnBlur && touched && validationRules[field]) {
      validateFieldInternal(field, state.values[field] || '');
    }
  }, [validateOnBlur, validationRules, state.values]);

  // すべてのフィールドをタッチ済みに設定
  const setAllTouched = useCallback(() => {
    const touchedFields: Record<string, boolean> = {};
    Object.keys(validationRules).forEach(field => {
      touchedFields[field] = true;
    });
    setState(prev => ({
      ...prev,
      touched: touchedFields,
    }));
  }, [validationRules]);

  // 内部的なフィールドバリデーション
  const validateFieldInternal = useCallback(async (field: string, value: string) => {
    if (!validationRules[field]) return { isValid: true };

    setState(prev => ({ ...prev, isValidating: true }));

    try {
      const result = validation.validateField(value, validationRules[field]);
      
      setState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [field]: result.error || '',
        },
        warnings: {
          ...prev.warnings,
          [field]: result.warnings || [],
        },
        isValidating: false,
      }));

      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [field]: 'validation.error',
        },
        isValidating: false,
      }));
      return { isValid: false, error: 'validation.error' };
    }
  }, [validationRules]);

  // 公開用のフィールドバリデーション
  const validateField = useCallback(async (field: string): Promise<ValidationResult> => {
    const value = state.values[field] || '';
    return validateFieldInternal(field, value);
  }, [state.values, validateFieldInternal]);

  // フォーム全体のバリデーション
  const validateForm = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isValidating: true }));

    try {
      const results = validation.validateForm(state.values, validationRules);
      
      const errors: Record<string, string> = {};
      const warnings: Record<string, string[]> = {};
      let isValid = true;

      Object.entries(results).forEach(([field, result]) => {
        errors[field] = result.error || '';
        warnings[field] = result.warnings || [];
        if (!result.isValid) {
          isValid = false;
        }
      });

      setState(prev => ({
        ...prev,
        errors,
        warnings,
        isValid,
        isValidating: false,
      }));

      return isValid;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isValid: false,
        isValidating: false,
      }));
      return false;
    }
  }, [state.values, validationRules]);

  // エラーをクリア
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: {},
      warnings: {},
    }));
  }, []);

  // 特定フィールドのエラーをクリア
  const clearError = useCallback((field: string) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: '' },
      warnings: { ...prev.warnings, [field]: [] },
    }));
  }, []);

  // フォームをリセット
  const reset = useCallback((newInitialValues?: Record<string, string>) => {
    const resetValues = newInitialValues || initialValues;
    setState({
      values: resetValues,
      errors: {},
      warnings: {},
      touched: {},
      isValid: true,
      isValidating: false,
    });
  }, [initialValues]);

  // フォームの有効性を計算
  useEffect(() => {
    const hasErrors = Object.values(state.errors).some(error => error !== '');
    setState(prev => ({
      ...prev,
      isValid: !hasErrors,
    }));
  }, [state.errors]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      Object.values(debounceTimers).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [debounceTimers]);

  const actions: FormValidationActions = {
    setValue,
    setValues,
    setTouched,
    setAllTouched,
    validateField,
    validateForm,
    clearErrors,
    clearError,
    reset,
  };

  return [state, actions];
};