import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function Button({ asChild, children, className = '', ...props }: ButtonProps) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      className: ["inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white", (children as any).props?.className, className].filter(Boolean).join(' '),
      ...props,
    });
  }

  return (
    <button className={["inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white", className].filter(Boolean).join(' ')} {...props}>
      {children}
    </button>
  );
}

export default Button;
