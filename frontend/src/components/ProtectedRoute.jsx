import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * <ProtectedRoute>
 * Wraps any route that requires authentication.
 * Saves the attempted URL so Login can redirect back after sign-in.
 *
 * Usage in App.jsx:
 *   <Route path='/place-order' element={<ProtectedRoute><PlaceOrder /></ProtectedRoute>} />
 */
const ProtectedRoute = ({ children }) => {
    const { token } = useAuth();
    const location  = useLocation();

    if (!token) {
        // Pass the intended destination so Login can redirect back
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
