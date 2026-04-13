let timerId: NodeJS.Timeout | null = null;

self.onmessage = (e) => {
  if (e.data.command === 'start') {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
      self.postMessage({ type: 'tick' });
    }, 1000);
  } else if (e.data.command === 'stop') {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }
};
