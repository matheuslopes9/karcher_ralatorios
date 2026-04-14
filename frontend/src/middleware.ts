import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // Se está tentando acessar login e já está autenticado
  if (pathname === '/login' && authToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Se está tentando acessar rota protegida sem autenticação
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/results') ||
      pathname.startsWith('/analytics') ||
      pathname.startsWith('/reports') ||
      pathname.startsWith('/settings')) {
    
    if (!authToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
