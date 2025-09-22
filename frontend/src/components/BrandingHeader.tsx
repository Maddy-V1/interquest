import React from 'react'

interface BrandingHeaderProps {
  title?: string
  subtitle?: string
  className?: string
}

function BrandingHeader({ title = "InterQuest", subtitle, className = "" }: BrandingHeaderProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-2xl p-6 mb-8 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Left Logo - GGSIPU */}
        <div className="flex items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center mr-4">
            <span className="text-white font-bold text-sm">GGSIPU</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm text-gray-600">Guru Gobind Singh</p>
            <p className="text-sm text-gray-600">Indraprastha University</p>
          </div>
        </div>

        {/* Center - Main Title */}
        <div className="text-center flex-1 mx-4">
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text mb-2">
            {title}
          </h1>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-lg md:text-xl font-semibold text-gray-700">
              <span className="text-orange-600 font-bold">IETE</span> Student Forum
            </span>
          </div>
          {subtitle && (
            <p className="text-gray-600 text-sm md:text-base">{subtitle}</p>
          )}
        </div>

        {/* Right Logo - IETE */}
        <div className="flex items-center">
          <div className="hidden sm:block text-right mr-4">
            <p className="text-sm text-gray-600">Institution of Electronics</p>
            <p className="text-sm text-gray-600">& Telecommunication Engineers</p>
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">IETE</span>
          </div>
        </div>
      </div>
      
      {/* Mobile-friendly organization names */}
      <div className="sm:hidden mt-4 text-center">
        <div className="flex justify-between text-xs text-gray-600">
          <span>GGSIPU</span>
          <span><span className="text-orange-600 font-bold">IETE</span> Student Forum</span>
          <span>IETE</span>
        </div>
      </div>
    </div>
  )
}

export default BrandingHeader