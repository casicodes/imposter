type AppContainerProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Default app shell: content column matches Paper artboard width (~390px).
 */
export function AppContainer({ children, className = "" }: AppContainerProps) {
  return (
    <div
      className={`mx-auto w-full max-w-[390px] ${className}`.trim()}
    >
      {children}
    </div>
  );
}
