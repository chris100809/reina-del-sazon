import { spawn } from 'node:child_process';
import { PermanentError } from '../utils/errors.js';

// Ejecuta un proceso externo y junta stdout/stderr. Respeta AbortSignal y timeout.
export function runProcess(cmd, args, { input, signal, timeoutMs = 10 * 60 * 1000, env, cwd } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'], env: env ?? process.env, cwd, windowsHide: true });
    let stdout = '';
    let stderr = '';
    let killedBy = null;
    const kill = (why) => {
      killedBy = why;
      child.kill('SIGKILL');
    };
    const timer = setTimeout(() => kill(`timeout tras ${timeoutMs / 1000}s`), timeoutMs);
    const onAbort = () => kill('abortado');
    signal?.addEventListener('abort', onAbort, { once: true });

    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', (err) => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      if (err.code === 'ENOENT') reject(new PermanentError(`No se encontró el ejecutable "${cmd}". ¿Está instalado y en el PATH?`));
      else reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      if (killedBy) return reject(new Error(`${cmd} ${killedBy}`));
      resolve({ code, stdout, stderr });
    });
    child.stdin.on('error', () => {}); // el proceso pudo cerrar stdin antes de tiempo
    child.stdin.end(input ?? '');
  });
}
