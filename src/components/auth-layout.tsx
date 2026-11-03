import React from "react";
import bgImage from "../assets/AuthBackgroundImg.jpg";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat relative px-4 sm:px-6 lg:px-8 py-10"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="w-full max-w-125 bg-white rounded-[10px] shadow-2xl p-6 sm:p-10 md:p-12 relative z-10 mx-auto">
        <div className="text-center mb-8">
          <h1 className="md:text-2xl text-xl text-[#1d7bd8] sm:text-3xl font-medium mb-2">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-gray-500 text-sm sm:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;
