import './globals.css';

export const metadata = {
    title: 'APC Karma — Work Hour Tracker',
    description: 'Gamified work-hour tracker for Assistant Placement Coordinators',
    icons: { icon: '/mascot.jpg' },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{
                    __html: `
            (function() {
              const theme = localStorage.getItem('apckarma-theme') || 'dark';
              document.documentElement.setAttribute('data-theme', theme);
            })();
          `
                }} />
            </head>
            <body>{children}</body>
        </html>
    );
}
