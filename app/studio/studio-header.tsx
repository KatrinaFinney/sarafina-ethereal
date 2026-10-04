'use client';

import { SignOutButton } from '@clerk/nextjs';

export default function StudioHeader() {
  return (
    <div className="studio-header">
      <a href="/" className="brand">SARAFINA ETHEREAL</a>
      <SignOutButton redirectUrl="/">
        <button type="button" className="studio-sign-out">Sign out</button>
      </SignOutButton>
    </div>
  );
}
