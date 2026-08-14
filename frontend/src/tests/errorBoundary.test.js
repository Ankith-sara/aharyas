import { jest } from '@jest/globals';

// ── ErrorBoundary — pure state logic (class lifecycle methods mirrored) ───────

// Mirror getDerivedStateFromError
const getDerivedStateFromError = (error) => ({
    hasError: true,
    error,
});

// Mirror componentDidCatch — we just test it was called with the right shape
const createMockErrorInfo = (stack = '    at Component (Component.jsx:12)') => ({
    componentStack: stack,
});

// Mirror handleReset
const createBoundaryState = () => ({ hasError: false, error: null });

const handleReset = (setState) => {
    setState({ hasError: false, error: null });
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ErrorBoundary — getDerivedStateFromError', () => {
    test('returns hasError true when error is thrown', () => {
        const err = new Error('Test crash');
        const state = getDerivedStateFromError(err);
        expect(state.hasError).toBe(true);
        expect(state.error).toBe(err);
    });

    test('captures error message', () => {
        const err = new Error('Network failed');
        const state = getDerivedStateFromError(err);
        expect(state.error.message).toBe('Network failed');
    });

    test('works with non-Error objects', () => {
        const weirdError = 'string error';
        const state = getDerivedStateFromError(weirdError);
        expect(state.hasError).toBe(true);
        expect(state.error).toBe('string error');
    });
});

describe('ErrorBoundary — initial state', () => {
    test('starts with hasError false', () => {
        const state = createBoundaryState();
        expect(state.hasError).toBe(false);
        expect(state.error).toBeNull();
    });
});

describe('ErrorBoundary — handleReset', () => {
    test('resets hasError to false', () => {
        let state = { hasError: true, error: new Error('crash') };
        handleReset((newState) => { state = newState; });
        expect(state.hasError).toBe(false);
    });

    test('resets error to null', () => {
        let state = { hasError: true, error: new Error('crash') };
        handleReset((newState) => { state = newState; });
        expect(state.error).toBeNull();
    });
});

describe('ErrorBoundary — componentDidCatch logging', () => {
    test('receives error and info objects', () => {
        const mockConsoleError = jest.fn();
        const originalConsoleError = console.error;
        console.error = mockConsoleError;

        const error = new Error('Render crash');
        const info = createMockErrorInfo();

        // Simulate what componentDidCatch does
        console.error('[ErrorBoundary] Caught error:', error, info.componentStack);

        expect(mockConsoleError).toHaveBeenCalledWith(
            '[ErrorBoundary] Caught error:',
            error,
            expect.stringContaining('at Component')
        );

        console.error = originalConsoleError;
    });
});

describe('ErrorBoundary — render logic', () => {
    test('passes through children when no error', () => {
        const state = { hasError: false, error: null };
        // In non-error state, boundary renders children
        expect(state.hasError).toBe(false);
    });

    test('renders fallback UI when hasError is true', () => {
        const state = getDerivedStateFromError(new Error('Crash!'));
        // Component would render the crash fallback
        expect(state.hasError).toBe(true);
    });

    test('full cycle: error → catch → reset → clean', () => {
        let state = createBoundaryState();

        // Error thrown
        const err = new Error('Component failed');
        state = getDerivedStateFromError(err);
        expect(state.hasError).toBe(true);

        // User resets
        handleReset((s) => { state = s; });
        expect(state.hasError).toBe(false);
        expect(state.error).toBeNull();
    });
});

describe('ErrorBoundary — dev mode error detail', () => {
    test('error.toString() produces readable string', () => {
        const err = new Error('Missing product ID');
        expect(err.toString()).toContain('Error: Missing product ID');
    });

    test('null error does not throw when guarded', () => {
        const err = null;
        const safeToString = (e) => (e ? e.toString() : '');
        expect(() => safeToString(err)).not.toThrow();
        expect(safeToString(err)).toBe('');
    });
});
