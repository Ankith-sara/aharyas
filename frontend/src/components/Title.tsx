import React from 'react';

interface TitleProps {
  text1: string;
  text2: string;
  subtitle?: string;
}

const Title: React.FC<TitleProps> = ({ text1, text2, subtitle }) => (
  <div className="inline-flex flex-col items-center gap-1">
    <h2 className="text-2xl sm:text-3xl font-light tracking-wide text-black">
      {text1}{' '}
      <span className="font-semibold">{text2}</span>
    </h2>
    {subtitle && (
      <p className="text-sm text-gray-500 font-light max-w-md text-center leading-relaxed">
        {subtitle}
      </p>
    )}
  </div>
);

export default Title;
