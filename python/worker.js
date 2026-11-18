// Runs Python (Pyodide) off the main thread, so a loop that never ends can be stopped without freezing the page.
const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.29.5/full/';
let py = null;
async function boot() {
  if (py) return py;
  importScripts(PYODIDE + 'pyodide.js');
  py = await loadPyodide({ indexURL: PYODIDE });
  py.runPython(`
import sys, io, builtins, traceback, os
os.makedirs('/home/pyodide', exist_ok=True); os.chdir('/home/pyodide')
def _gq_run(code, lines, check, folder):
    d = '/home/pyodide/' + (folder or 'main')
    os.makedirs(d, exist_ok=True); os.chdir(d)
    it = iter(lines)
    out = io.StringIO()
    def _input(prompt=''):
        v = next(it, None)
        if v is None:
            raise EOFError('input() needs an answer: type it in the Input box, one answer per line')
        out.write(str(prompt) + v + '\\n')
        return v
    g = {'__name__': '__main__', 'input': _input}
    old = sys.stdout, sys.stderr
    sys.stdout = sys.stderr = out
    err = None; passed = None
    try:
        exec(compile(code, 'main.py', 'exec'), g)
    except BaseException as e:
        tb = traceback.format_exception(type(e), e, e.__traceback__)
        tb = [l for l in tb if '<exec>' not in l and 'File "/lib/' not in l]
        err = {'type': type(e).__name__, 'msg': str(e), 'tb': ''.join(tb)}
    finally:
        sys.stdout, sys.stderr = old
    text = out.getvalue()
    if check and err is None:
        g['OUT'] = text
        try:
            exec(check, g); passed = True
        except AssertionError as e:
            passed = str(e) or 'Not yet.'
        except BaseException as e:
            passed = type(e).__name__ + ': ' + str(e)
    return {'out': text, 'err': err, 'passed': passed}
`);
  return py;
}
self.onmessage = async e => {
  const { id, code, lines, check, folder } = e.data;
  try {
    const p = await boot();
    if (id === 'warm') { postMessage({ id, ready: true }); return; }
    if (/^\s*(import|from)\s/m.test(code)) { try { await p.loadPackagesFromImports(code); } catch (x) { /* standard library only */ } }
    const f = p.globals.get('_gq_run'), args = [code, p.toPy(lines || []), check || '', folder || ''];
    // With stack switching (Chrome, Edge, Android Chrome) asyncio.run and time.sleep work; elsewhere the plain call still runs everything else.
    let r; try { r = f.callPromising ? await f.callPromising(...args) : f(...args); } catch (x) { r = f(...args); }
    const js = r.toJs({ dict_converter: Object.fromEntries }); r.destroy();
    postMessage({ id, ...js });
  } catch (x) {
    postMessage({ id, boot: true, err: { type: 'LoadError', msg: String(x && x.message || x), tb: '' } });
  }
};
