import Link from "next/link"
import { Mail } from "lucide-react"

export default function VerifyEmailPage() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-4">
        <Mail className="w-7 h-7 text-blue-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Check your inbox</h2>
      <p className="text-sm text-gray-500 mb-6">
        We sent a verification link to your email address. Click it to activate your account and get started.
      </p>
      <div className="bg-gray-50 rounded-xl px-5 py-4 text-xs text-gray-500 text-left space-y-1.5">
        <p className="font-medium text-gray-700">Didn&apos;t get the email?</p>
        <p>• Check your spam or junk folder</p>
        <p>• Make sure you entered the correct email</p>
        <p>• Allow a few minutes for delivery</p>
      </div>
      <p className="text-xs text-gray-400 mt-6">
        Wrong email?{" "}
        <Link href="/auth/signup" className="text-blue-600 hover:underline">
          Sign up again
        </Link>
      </p>
    </div>
  )
}
