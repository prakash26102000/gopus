import React from 'react'
import Navbar from '../components/NavBar'
import Footer from '../components/Footer'

const TermAndConditions = () => {
  return (
    <>
      <div className='min-h-screen bg-gray-50 py-12'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl'>
          {/* Header */}
          <div className='text-center mb-12'>
            <h1 className='text-4xl font-bold text-gray-900 mb-4'>Terms and Conditions</h1>
            <p className='text-lg text-gray-600'>E-comservice.in</p>
            <div className='w-24 h-1 bg-blue-600 mx-auto mt-4'></div>
          </div>

          {/* Introduction Section */}
          <div className='bg-white rounded-lg shadow-lg p-8 mb-8'>
            <h2 className='text-2xl font-bold text-gray-900 mb-6 flex items-center'>
              <span className='bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3'>1</span>
              Introduction
            </h2>
            <div className='text-gray-700 leading-relaxed'>
              <p>
                These Terms and Conditions ("Agreement") outline the rules and guidelines for using E-comservice.in, an online shopping platform that sells men's shirts. By accessing and using E-comservice.in, you agree to be bound by these Terms and Conditions.
              </p>
            </div>
          </div>

          {/* Services Section */}
          <div className='bg-white rounded-lg shadow-lg p-8 mb-8'>
            <h2 className='text-2xl font-bold text-gray-900 mb-6 flex items-center'>
              <span className='bg-green-100 text-green-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3'>2</span>
              GOPUS ECOM Services
            </h2>
            <div className='text-gray-700 leading-relaxed'>
              <p>
                GOPUS ECOM provides an online shopping platform for men's shirts. To use GOPUS ECOM Services, you must have a valid GOPUS ECOM account, be logged in to your account, and have a valid payment method associated with your account.
              </p>
            </div>
          </div>

          {/* Connectivity and Availability Section */}
          <div className='bg-white rounded-lg shadow-lg p-8 mb-8'>
            <h2 className='text-2xl font-bold text-gray-900 mb-6 flex items-center'>
              <span className='bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3'>3</span>
              Connectivity and Availability
            </h2>
            <div className='space-y-6 text-gray-700 leading-relaxed'>
              <div className='bg-blue-50 border-l-4 border-blue-400 p-4'>
                <h4 className='font-semibold text-blue-900 mb-2'>a. Internet Connectivity:</h4>
                <p className='text-blue-800'>
                  E-comservice Services may require an Internet connection from a third-party provider. Your Internet connection is subject to the fees, restrictions, terms, and limitations imposed by your provider.
                </p>
              </div>

              <div className='bg-yellow-50 border-l-4 border-yellow-400 p-4'>
                <h4 className='font-semibold text-yellow-900 mb-2'>b. Availability:</h4>
                <p className='text-yellow-800'>
                  Some E-comservice Services may be unavailable, vary by product or geography, be offered for a limited time, or require separate subscriptions.
                </p>
              </div>
            </div>
          </div>

          {/* General Terms Section */}
          <div className='bg-white rounded-lg shadow-lg p-8 mb-8'>
            <h2 className='text-2xl font-bold text-gray-900 mb-6 flex items-center'>
              <span className='bg-orange-100 text-orange-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3'>4</span>
              General Terms
            </h2>
            <div className='space-y-6 text-gray-700 leading-relaxed'>
              <div className='border-l-4 border-gray-300 pl-4'>
                <h4 className='font-semibold text-gray-900 mb-2'>a. Information Received:</h4>
                <p>
                  GOPUS ECOM may collect information about your use of the website, including search queries, viewing and usage data, and other information. This information may be processed in the cloud to improve your experience and our services. We will handle any information we receive in accordance with the GOPUS ECOM Privacy Notice.
                </p>
              </div>

              <div className='border-l-4 border-gray-300 pl-4'>
                <h4 className='font-semibold text-gray-900 mb-2'>b. Information Provided to Others:</h4>
                <p>
                  You are responsible for any information you provide to third-party providers. Use of information you provide to these third parties will be subject to any privacy notice or other terms that they may provide to you.
                </p>
              </div>

              <div className='border-l-4 border-gray-300 pl-4'>
                <h4 className='font-semibold text-gray-900 mb-2'>c. Changes to GOPUS ECOM Services; Amendments:</h4>
                <p>
                  We may change, suspend, or discontinue the GOPUS ECOM Services, or any part of them, at any time without notice. We may amend any of this Agreement's terms at our sole discretion by posting the revised terms on the GOPUS ECOM website. Your continued use of GOPUS ECOM Services after the effective date of the revised Agreement constitutes your acceptance of the terms.
                </p>
              </div>

              <div className='border-l-4 border-red-300 pl-4 bg-red-50 p-4 rounded'>
                <h4 className='font-semibold text-red-900 mb-2'>d. Termination:</h4>
                <p className='text-red-800'>
                  Your rights under this Agreement will automatically terminate without notice if you fail to comply with any of its terms. In case of such termination, E-comservice.in may immediately revoke your access to the E-comservice Services.
                </p>
              </div>

              <div className='border-l-4 border-gray-300 pl-4'>
                <h4 className='font-semibold text-gray-900 mb-2'>e. Disputes/Binding Arbitration:</h4>
                <p>
                  Any dispute or claim arising from or relating to this Agreement, E-comservice.in, or the E-comservice Services is subject to the binding arbitration, governing law, disclaimer of warranties, limitation of liability, and all other terms in the E-comservice.in Conditions of Use. You agree to those terms by entering into this Agreement, or using E-comservice.in.
                </p>
              </div>
            </div>
          </div>

          {/* Disclaimer Section */}
          <div className='bg-white rounded-lg shadow-lg p-8 mb-8'>
            <h2 className='text-2xl font-bold text-gray-900 mb-6 flex items-center'>
              <span className='bg-red-100 text-red-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3'>5</span>
              Disclaimer of Warranties
            </h2>
            <div className='bg-red-50 border border-red-200 rounded-lg p-6'>
              <p className='text-red-800 leading-relaxed'>
                E-comservice.in provides the GOPUS ECOM Services on an "as is" and "as available" basis, without warranties of any kind, express or implied. We disclaim all warranties, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
              </p>
            </div>
          </div>

          {/* Entire Agreement Section */}
          <div className='bg-white rounded-lg shadow-lg p-8'>
            <h2 className='text-2xl font-bold text-gray-900 mb-6 flex items-center'>
              <span className='bg-gray-100 text-gray-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3'>6</span>
              Entire Agreement
            </h2>
            <div className='bg-gray-50 border border-gray-200 rounded-lg p-6'>
              <p className='text-gray-700 leading-relaxed'>
                This Agreement constitutes the entire agreement between you and E-comservice.in regarding the use of E-comservice.in and the E-comservice Services. This Agreement supersedes all prior or contemporaneous agreements or understandings, whether written or oral.
              </p>
            </div>
          </div>
        </div>
      </div>
      
    </>
  )
}

export default TermAndConditions;