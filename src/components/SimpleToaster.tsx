"use client"

import { Toaster as Sonner } from "sonner"

const SimpleToaster = () => {
  return (
    <Sonner 
      position="top-right"
      theme="light"
      richColors={false}
      expand={false}
      closeButton={true}
      duration={4000}
    />
  );
};

export { SimpleToaster as Toaster }