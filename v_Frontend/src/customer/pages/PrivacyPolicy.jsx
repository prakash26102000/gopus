import React from 'react'
import Footer from '../components/Footer'
import Navbar from '../components/NavBar'

const PrivacyPolicy = () => {
    return (
        <>
            <div className='min-h-screen bg-gray-50 py-12'>
                <div className='container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl'>
                    {/* Header */}
                    <div className='text-center mb-12'>
                        <h1 className='text-4xl font-bold text-gray-900 mb-4'>Privacy Policy</h1>
                        <p className='text-lg text-gray-600'>Comservice.com</p>
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
                                At Comservice.com, we value the trust you place in us and recognize the importance of secure transactions and information privacy. This Privacy Policy describes how we collect, use, share, or otherwise process your personal data through our website Comservice.com.
                            </p>
                        </div>
                    </div>

                    {/* Collection of Information Section */}
                    <div className='bg-white rounded-lg shadow-lg p-8 mb-8'>
                        <h2 className='text-2xl font-bold text-gray-900 mb-6 flex items-center'>
                            <span className='bg-green-100 text-green-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3'>2</span>
                            Collection of Your Information
                        </h2>
                        <div className='text-gray-700 leading-relaxed'>
                            <p>
                                When you use our Platform, we collect and store your information, which is provided by you from time to time. Once you give us your personal data, you are not anonymous to us. Where possible, we indicate which fields are required and which fields are optional.
                            </p>
                        </div>
                    </div>

                    {/* Use of Information Section */}
                    <div className='bg-white rounded-lg shadow-lg p-8 mb-8'>
                        <h2 className='text-2xl font-bold text-gray-900 mb-6 flex items-center'>
                            <span className='bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3'>3</span>
                            Use of Demographic / Profile Data / Your Information
                        </h2>
                        <div className='space-y-6 text-gray-700 leading-relaxed'>
                            <p>
                                We use your personal data to take and fulfill orders, deliver products and services, process payments, and communicate with you about orders, products, and services, and promotional offers. To the extent we use your personal data to market to you, we will provide you the ability to opt-out of such uses.
                            </p>

                            <p>
                                We use your personal data to assist sellers and business partners in handling and fulfilling orders; enhancing customer experience; resolve disputes; troubleshoot problems; help promote a safe service; collect money; measure consumer interest in our products and services; inform you about online and offline offers, products, services, and updates; customize and enhance your experience; report to regulatory authorities wherever required, detect and protect us against error, fraud, and other criminal activity; enforce our terms and conditions; and as otherwise described to you at the time of collection of information.
                            </p>

                            <div className='bg-yellow-50 border-l-4 border-yellow-400 p-4'>
                                <h4 className='font-semibold text-yellow-800 mb-2'>Additional Information We May Request:</h4>
                                <p className='text-yellow-700 mb-3'>
                                    With your consent, we may have access to your SMS, instant messages, contacts in your directory, location. We may also request you to provide your PAN, credit information report (from credit agencies), GST Number, Government issued ID cards/number, and Know-Your-Customer (KYC) details to:
                                </p>
                                <ul className='space-y-2 text-yellow-700'>
                                    <li className='flex items-start space-x-2'>
                                        <span className='text-yellow-600 mt-1'>•</span>
                                        <span>Check your eligibility for certain products and services like insurance, credit, and payment products</span>
                                    </li>
                                    <li className='flex items-start space-x-2'>
                                        <span className='text-yellow-600 mt-1'>•</span>
                                        <span>Issue GST invoice for the products and services purchased for your business requirements</span>
                                    </li>
                                    <li className='flex items-start space-x-2'>
                                        <span className='text-yellow-600 mt-1'>•</span>
                                        <span>Enhance your experience on the Platform and provide you access to the products and services being offered by us, sellers, affiliates, or lending partners</span>
                                    </li>
                                </ul>
                            </div>

                            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                                <p className='text-red-800'>
                                    <strong>Important:</strong> You agree that Comservice shall not be liable or responsible for the activities or consequences of use or misuse of any information that occurs under your Account in cases, including, where You have failed to update Your revised mobile phone number and/or e-mail address on the Website Platform.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Cookies Section */}
                    <div className='bg-white rounded-lg shadow-lg p-8'>
                        <h2 className='text-2xl font-bold text-gray-900 mb-6 flex items-center'>
                            <span className='bg-orange-100 text-orange-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3'>4</span>
                            Cookies
                        </h2>
                        <div className='text-gray-700 leading-relaxed space-y-4'>
                            <p>
                                We use data collection devices such as "cookies" on certain pages of the Platform to help analyze our web page flow, measure promotional effectiveness, and promote trust and safety.
                            </p>

                            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                                <h4 className='font-semibold text-blue-900 mb-2'>What are Cookies?</h4>
                                <p className='text-blue-800'>
                                    "Cookies" are small files placed on your hard drive that assist us in providing our services. Cookies do not contain any of your personal data.
                                </p>
                            </div>

                            <div className='space-y-3'>
                                <h4 className='font-semibold text-gray-900'>How We Use Cookies:</h4>
                                <ul className='space-y-2'>
                                    <li className='flex items-start space-x-2'>
                                        <span className='text-blue-600 mt-1'>•</span>
                                        <span>Offer certain features that are only available through the use of cookies</span>
                                    </li>
                                    <li className='flex items-start space-x-2'>
                                        <span className='text-blue-600 mt-1'>•</span>
                                        <span>Allow you to enter your password less frequently during a session</span>
                                    </li>
                                    <li className='flex items-start space-x-2'>
                                        <span className='text-blue-600 mt-1'>•</span>
                                        <span>Provide information that is targeted to your interests</span>
                                    </li>
                                </ul>
                            </div>

                            <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                                <p className='text-gray-700'>
                                    <strong>Your Choice:</strong> You are always free to decline/delete our cookies if your browser permits, although in that case you may not be able to use certain features on the Platform and you may be required to re-enter your password more frequently during a session. Most cookies are "session cookies," meaning that they are automatically deleted from your hard drive at the end of a session.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </>
    )
}

export default PrivacyPolicy;