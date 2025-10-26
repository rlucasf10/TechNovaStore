/// <reference types="@testing-library/jest-dom" />

import '@testing-library/jest-dom/extend-expect'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveTextContent(text: string | RegExp): R
      toBeDisabled(): R
      toBeEnabled(): R
      toHaveClass(className: string): R
      toHaveAttribute(attr: string, value?: string): R
      toBeVisible(): R
      toBeChecked(): R
      toHaveFocus(): R
      toHaveValue(value: string | number): R
    }
  }
}