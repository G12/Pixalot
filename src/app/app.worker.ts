/// <reference lib="webworker" />

function fibonacci(num): number {
  console.log('num: ' + num);
  if (num === 1 || num === 2) {
    return 1;
  }
  return fibonacci(num - 1) + fibonacci(num - 2);
}

addEventListener('message', (evt) => {
  const num = evt.data;
  postMessage(fibonacci(num));
});

/*
addEventListener('message', ({ data }) => {
  const response = `worker response to ${data}`;
  postMessage(response);
});
*/

