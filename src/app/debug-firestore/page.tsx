'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, getFirestore, doc, getDoc, addDoc } from 'firebase/firestore'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function DebugFirestore() {
  const [debugData, setDebugData] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const debugFirestore = async () => {
    setLoading(true)
    try {
      const db = getFirestore()

      // Check all collections
      const collections = ['orderData', 'awb_orders', 'salesTeamData', 'marketingData']
      const results: any = {}

      for (const collectionName of collections) {
        console.log(`🔍 Checking collection: ${collectionName}`)
        const querySnapshot = await getDocs(collection(db, collectionName))

        results[collectionName] = {
          count: querySnapshot.size,
          docs: []
        }

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          results[collectionName].docs.push({
            id: doc.id,
            ...data
          })
        })

        console.log(`📄 ${collectionName}: Found ${querySnapshot.size} documents`)
      }

      // Check if there are any orders in orderData
      if (results.orderData && results.orderData.docs.length > 0) {
        console.log('📦 Sample orderData documents:', results.orderData.docs.slice(0, 3))
      }

      setDebugData(results)
    } catch (error: any) {
      console.error('❌ Error debugging Firestore:', error)
      setDebugData({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testSaveOrder = async () => {
    setLoading(true)
    try {
      const db = getFirestore()
      const testOrder = {
        tarikh: new Date().toISOString().split('T')[0],
        code_kain: 'TEST-001',
        nombor_po_invoice: `TEST-${Date.now()}`,
        nama_customer: 'Test Customer',
        team_sale: 'Test Team',
        nombor_phone: '01234567890',
        jenis_order: 'Test Product',
        total_rm: 100.50,
        platform: 'Test Platform',
        source: 'debug_test',
        createdAt: new Date()
      }

      console.log('💾 Saving test order:', testOrder)

      const docRef = await addDoc(collection(db, 'orderData'), testOrder)
      console.log('✅ Test order saved with ID:', docRef.id)

      // Verify it was saved
      const savedDoc = await getDoc(doc(db, 'orderData', docRef.id))
      if (savedDoc.exists()) {
        console.log('✅ Order verified in database:', savedDoc.data())
        alert('✅ Test order saved successfully! Check the orders dashboard.')
      } else {
        console.error('❌ Order not found after saving')
        alert('❌ Error: Order not found in database')
      }

      // Reload debug data
      await debugFirestore()
    } catch (error: any) {
      console.error('❌ Error testing save:', error)
      alert(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔍 Firebase Debug Tool</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Database Diagnostics</h2>
            <div className="space-y-4">
              <Button
                onClick={debugFirestore}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Loading...' : '🔍 Debug Firestore Collections'}
              </Button>

              <Button
                onClick={testSaveOrder}
                disabled={loading}
                variant="secondary"
                className="w-full"
              >
                {loading ? 'Testing...' : '🧪 Test Save Order'}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            <div className="space-y-4">
              {loading && <p className="text-gray-600">Loading debug data...</p>}

              {Object.keys(debugData).length === 0 && !loading && (
                <p className="text-gray-500">Click "Debug Firestore Collections" to see data</p>
              )}

              {debugData.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">Error:</p>
                  <p className="text-red-600 text-sm">{debugData.error}</p>
                </div>
              )}

              {Object.keys(debugData).length > 0 && !debugData.error && (
                Object.entries(debugData).map(([collectionName, data]: [string, any]) => (
                  <div key={collectionName} className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-gray-900">
                      {collectionName} ({data.count} documents)
                    </h3>
                    {data.docs && data.docs.length > 0 && (
                      <div className="mt-2 space-y-2">
                        <details className="cursor-pointer">
                          <summary className="text-sm text-gray-600 hover:text-gray-900">
                            📄 Show sample documents ({Math.min(3, data.docs.length)} of {data.docs.length})
                          </summary>
                          <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                            {data.docs.slice(0, 3).map((doc: any, index: number) => (
                              <div key={index} className="p-3 bg-gray-50 rounded-lg text-xs font-mono">
                                <div>ID: {doc.id}</div>
                                <div>Customer: {doc.nama_customer || 'N/A'}</div>
                                <div>Amount: RM {doc.total_rm || 0}</div>
                                <div>Date: {doc.tarikh || 'N/A'}</div>
                                <div>Platform: {doc.platform || 'N/A'}</div>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">📋 Troubleshooting Checklist</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start">
              <input type="checkbox" className="mt-1 mr-3" />
              <div>
                <strong>Firebase Connection:</strong> Check if Firebase is properly connected
              </div>
            </div>
            <div className="flex items-start">
              <input type="checkbox" className="mt-1 mr-3" />
              <div>
                <strong>Collection Access:</strong> Verify you can access the orderData collection
              </div>
            </div>
            <div className="flex items-start">
              <input type="checkbox" className="mt-1 mr-3" />
              <div>
                <strong>Data Structure:</strong> Confirm the saved data matches expected OrderData interface
              </div>
            </div>
            <div className="flex items-start">
              <input type="checkbox" className="mt-1 mr-3" />
              <div>
                <strong>Real-time Updates:</strong> Check if the dashboard fetches latest data
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-8">
          <Button href="/orders" variant="secondary">
            ← Back to Orders Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}