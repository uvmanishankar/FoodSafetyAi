import React from 'react';

export function Button({ asChild, children, className = '', ...props }) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: ["inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white", children.props?.className, className].filter(Boolean).join(' '),
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
