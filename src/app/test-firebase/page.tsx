'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function TestFirebasePage() {
  const [status, setStatus] = useState<string>('Testing...')
  const [results, setResults] = useState<any>({})
  const [error, setError] = useState<string | null>(null)

  const testFirebase = async () => {
    setStatus('🔍 Testing Firebase connection...')
    setError(null)

    try {
      console.log('Starting Firebase test...')

      // Test 1: Check Firebase initialization
      setStatus('✅ Firebase initialized')
      console.log('Firebase DB:', db)

      // Test 2: Test orderData collection
      setStatus('📦 Fetching orderData...')
      const ordersRef = collection(db, 'orderData')
      const ordersSnapshot = await getDocs(ordersRef)
      const ordersCount = ordersSnapshot.size
      console.log(`Orders found: ${ordersCount}`)

      // Test 3: Test marketingData collection
      setStatus('📈 Fetching marketingData...')
      const marketingRef = collection(db, 'marketingData')
      const marketingSnapshot = await getDocs(marketingRef)
      const marketingCount = marketingSnapshot.size
      console.log(`Marketing records found: ${marketingCount}`)

      // Test 4: Test salesTeamData collection
      setStatus('👥 Fetching salesTeamData...')
      const salesRef = collection(db, 'salesTeamData')
      const salesSnapshot = await getDocs(salesRef)
      const salesCount = salesSnapshot.size
      console.log(`Sales team records found: ${salesCount}`)

      // Test 5: Test followUpData collection
      setStatus('📞 Fetching followUpData...')
      const followUpRef = collection(db, 'followUpData')
      const followUpSnapshot = await getDocs(followUpRef)
      const followUpCount = followUpSnapshot.size
      console.log(`Follow-up records found: ${followUpCount}`)

      // Set results
      setResults({
        orders: ordersCount,
        marketing: marketingCount,
        salesTeam: salesCount,
        followUp: followUpCount
      })

      setStatus('✅ All tests completed!')

    } catch (err: any) {
      console.error('Firebase test error:', err)
      setError(err.message || 'Unknown error')
      setStatus('❌ Test failed')
    }
  }

  useEffect(() => {
    testFirebase()
  }, [])

  return (
    <div className="min-h-screen gradient-soft p-8">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Firebase Connection Test</h1>

        <Card className="p-8 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Status</h2>
          <p className="text-lg mb-4">{status}</p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <h3 className="text-red-800 font-semibold mb-2">Error:</h3>
              <p className="text-red-700 font-mono text-sm">{error}</p>
            </div>
          )}

          <Button onClick={testFirebase} variant="primary">
            Run Test Again
          </Button>
        </Card>

        {Object.keys(results).length > 0 && (
          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-4">Results</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Orders Collection:</span>
                <span className={`font-bold ${results.orders > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {results.orders} documents
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Marketing Collection:</span>
                <span className={`font-bold ${results.marketing > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {results.marketing} documents
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Sales Team Collection:</span>
                <span className={`font-bold ${results.salesTeam > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {results.salesTeam} documents
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Follow Up Collection:</span>
                <span className={`font-bold ${results.followUp > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {results.followUp} documents
                </span>
              </div>
            </div>

            {results.orders === 0 && results.marketing === 0 && results.salesTeam === 0 && (
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h3 className="text-yellow-800 font-semibold mb-2">⚠️ No Data Found</h3>
                <p className="text-yellow-700">
                  Your Firebase collections are empty. Please add data using the input forms first:
                </p>
                <ul className="list-disc list-inside mt-2 text-yellow-700">
                  <li>Add orders via /ecommerce</li>
                  <li>Add marketing data via /marketing</li>
                  <li>Add sales team data via /salesteam</li>
                </ul>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
