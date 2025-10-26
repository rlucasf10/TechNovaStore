import { formatPrice, formatDate, slugify, cn, debounce } from '../utils'

describe('Utils', () => {
  describe('formatPrice', () => {
    it('should format price in euros with correct currency symbol', () => {
      expect(formatPrice(99.99)).toContain('€')
      expect(formatPrice(0)).toContain('€')
      expect(formatPrice(1000)).toContain('€')
    })

    it('should format decimal prices correctly', () => {
      const formatted = formatPrice(99.99)
      expect(formatted).toMatch(/99[,.]99/) // Accept both comma and dot as decimal separator
    })

    it('should format whole numbers with decimals', () => {
      const formatted = formatPrice(100)
      expect(formatted).toMatch(/100[,.]00/)
    })

    it('should handle zero correctly', () => {
      const formatted = formatPrice(0)
      expect(formatted).toMatch(/0[,.]00/)
    })

    it('should format large numbers', () => {
      const formatted = formatPrice(1000)
      // Accept both with and without thousands separator
      expect(formatted).toMatch(/1[.]?000[,.]00/)
    })
  })

  describe('formatDate', () => {
    it('should format date in Spanish', () => {
      const date = new Date('2024-01-15')
      const formatted = formatDate(date)
      expect(formatted).toContain('enero')
      expect(formatted).toContain('2024')
    })

    it('should format string date', () => {
      const formatted = formatDate('2024-01-15')
      expect(formatted).toContain('enero')
      expect(formatted).toContain('2024')
    })
  })

  describe('slugify', () => {
    it('should convert text to slug', () => {
      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('Café con Leche')).toBe('cafe-con-leche')
      expect(slugify('Test   Multiple   Spaces')).toBe('test-multiple-spaces')
    })

    it('should handle special characters', () => {
      expect(slugify('Test@#$%^&*()')).toBe('test')
      expect(slugify('Niño & Niña')).toBe('nino-nina')
    })

    it('should trim hyphens', () => {
      expect(slugify('  -test-  ')).toBe('test')
      expect(slugify('---test---')).toBe('test')
    })
  })

  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
      expect(cn('class1', undefined, 'class2')).toBe('class1 class2')
    })
  })

  describe('debounce', () => {
    jest.useFakeTimers()

    it('should debounce function calls', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    afterEach(() => {
      jest.clearAllTimers()
    })
  })
})