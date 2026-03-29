/**
 * RegisterPage component.
 *
 * Full-page registration view with RegisterForm component and
 * a link to the login page. On successful registration, redirects
 * to the login page with a success message.
 */

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import RegisterForm from '../components/auth/RegisterForm'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSuccess = () => {
    setSuccessMessage('Account created successfully! Redirecting to login…')
    setTimeout(() => {
      navigate('/login')
    }, 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">Multi-Modal AI Chat</h1>
          <p className="text-gray-500 mt-2">Create a new account</p>
        </div>

        {/* Card */}
        <div className="bg-white shadow-lg rounded-xl p-8">
          {successMessage ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm text-center">
              {successMessage}
            </div>
          ) : (
            <RegisterForm onSuccess={handleSuccess} />
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
