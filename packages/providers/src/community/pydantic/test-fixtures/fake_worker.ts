// Test fixture: emulates kl_answer_worker.py's stdio contract.
// Echoes the parsed request back inside structured_output.echo so provider
// tests can assert the request mapping without a real model call.
export {};

const input = await Bun.stdin.text();
const request = JSON.parse(input);

if (request.prompt === 'ERR') {
  console.log(JSON.stringify({ error: 'boom', kind: 'auth' }));
  process.exit(1);
}
if (request.prompt === 'CRASH') {
  console.error('kaboom');
  process.exit(2);
}

console.log(
  JSON.stringify({
    text: 'fixture-ok',
    structured_output: { echo: request },
    usage: { input_tokens: 10, output_tokens: 5, requests: 1 },
    session_id: 'pydantic-test',
  })
);
