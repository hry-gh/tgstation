import { useEffect } from 'react';

const BROWSER_BORDER = 10; // pixels

export function useChatPlacement() {
  useEffect(() => {
    console.log('Determining chat placement...');

    document.body.classList.remove('onmap');

    Byond.winget('browseroutput', 'parent').then((browserParent) => {
      if (browserParent === 'mapwindow') {
        Byond.winget('mapwindow', '*').then((mapProperties) => {
          const screenSize = (mapProperties.size as string).split('x');
          const screenX = parseInt(screenSize[0]);
          const screenY = parseInt(screenSize[1]);

          const browserX = screenX / 3;
          const browserY = screenY / 3;

          Byond.winset('browseroutput', {
            size: `${browserX}x${browserY}`,
            pos: `${screenX - (browserX + BROWSER_BORDER)},${BROWSER_BORDER}`,
            anchor1: '100,0',
            anchor2: '75,25',
          });

          document.body.classList.add('onmap');

          Byond.winset('mapinput', {
            parent: 'mapwindow',
            type: 'INPUT',
            size: `${browserX}x${20}`,
            pos: `${screenX - (browserX + BROWSER_BORDER)},${browserY + BROWSER_BORDER}`,
            'text-color': '#ffffff',
            'background-color': '#17181c',
            anchor1: '100,0',
            anchor2: '75,25',
          });
        });
      } else if (browserParent === 'output_browser') {
        Byond.winget('output_browser', '*').then(
          (outputBrowserWindowProperties) => {
            Byond.winset('browseroutput', {
              size: outputBrowserWindowProperties.size,
            });
          },
        );
      }
    });
  }, []);
}
