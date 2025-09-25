import React from 'react'
import Navbar from '../components/NavBar'
import Footer from '../components/Footer'

const RefundReturnPolicy = () => {
    return (
        <>
            <div className='min-h-screen bg-gray-50 py-12'>
                <div className='container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl'>
                    {/* Header */}
                    <div className='text-center mb-12'>
                        <h1 className='text-4xl font-bold text-gray-900 mb-4'>Refund & Return Policy</h1>
                        <p className='text-lg text-gray-600'>E-comservice.com</p>
                        <div className='w-24 h-1 bg-blue-600 mx-auto mt-4'></div>
                    </div>

                    {/* Return Policy Section */}
                    <div className='bg-white rounded-lg shadow-lg p-8'>
                        <h2 className='text-2xl font-bold text-gray-900 mb-6 flex items-center'>
                            <span className='bg-green-100 text-green-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3'>2</span>
                            Return Policy
                        </h2>
                        
                        <div className='space-y-6 text-gray-700 leading-relaxed'>
                            <div className='bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6'>
                                <p className='text-lg font-semibold text-yellow-800'>
                                    We offer refund/exchange within the first <strong>2 days</strong> from the date of purchase.
                                </p>
                                <p className='text-yellow-700 mt-2'>
                                    If 3 days have passed since your purchase, no returns, exchanges, or refunds will be offered.
                                </p>
                            </div>
                            
                            <h3 className='text-xl font-semibold text-gray-900 mb-4'>Eligibility Requirements:</h3>
                            
                            <div className='space-y-4'>
                                <div className='flex items-start space-x-3'>
                                    <span className='bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-1'>1</span>
                                    <p>The purchased item must be <strong>unused</strong> and in the same condition as received.</p>
                                </div>
                                
                                <div className='flex items-start space-x-3'>
                                    <span className='bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-1'>2</span>
                                    <p>The item must have <strong>original packaging</strong>.</p>
                                </div>
                                
                                <div className='flex items-start space-x-3'>
                                    <span className='bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-1'>3</span>
                                    <p>Sale items may not be eligible for return/exchange, except if found defective or damaged.</p>
                                </div>
                                
                                <div className='flex items-start space-x-3'>
                                    <span className='bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-1'>✓</span>
                                    <p><strong>Processing Time:</strong> Refunds are processed within 2-3 business days.</p>
                                </div>
                            </div>
                            
                            <div className='bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6'>
                                <h4 className='font-semibold text-blue-900 mb-2'>How to Request a Return/Exchange:</h4>
                                <p className='text-blue-800'>
                                    To qualify and be accepted for a return or exchange, an unboxing video is mandatory to claim any damage to the products purchased. Without providing a full video proof (from opening the seal of the package till the end without any edits, cuts, or filters), the return request shall be declined immediately.
                                </p>
                                <p className='text-blue-800 mt-3'>
                                    Any product damaging at your hands cannot be accepted for refund. If approved for return, ensure the product is in its original condition and accompanied by all original packaging, including the jewelry boxes. Once your product for return is received, allow 2 business days for the refunds to be credited back to your bank used for purchase.
                                </p>
                                <div className='bg-blue-100 border border-blue-300 rounded-lg p-4 mt-4'>
                                    <h5 className='font-semibold text-blue-900 mb-1'>Contact Support</h5>
                                    <p className='text-blue-800'>
                                        Email: <a href='mailto:examble@gmail.com' className='underline'>examble@gmail.com</a><br />
                                        Phone: <a href='tel:9740909090' className='underline'>9740909090</a>
                                    </p>
                                </div>
                            </div>
                            
                            <div className='border-t pt-6 mt-6'>
                                <p className='text-sm text-gray-600'>
                                    <strong>Note:</strong> Certain product categories may be exempt from returns or refunds. These will be clearly identified at the time of purchase. Once your returned item is received and inspected, we'll send you an email notification. If approved after quality check, your return/exchange will be processed according to our policies.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
        </>
    )
}

export default RefundReturnPolicy;