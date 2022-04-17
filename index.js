const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const Database = require('@replit/database');
const { customAlphabet } = require('nanoid');
const { readFile } = require('fs').promises;

const db = new Database();

const alphabet =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const size = 7;
const nanoid = customAlphabet(alphabet, size);
const idRegex = new RegExp(`^[${alphabet}]{${7}}$`);

const app = express();
app.use(morgan('dev'));

const urlencodedParser = bodyParser.urlencoded({ extended: false });

const html = readFile('index.html');

/**
 * GET /
 */
app.get('/', async (request, response) => {
  response.set('Content-Type', 'text/html');
  response.send(await html);
});

/**
 * POST /
 */
app.post('/', urlencodedParser, async (request, response) => {
  const { note } = request.body;
  response.set('Content-Type', 'text/html');

  if (!note) {
    response.send(await html);
    return;
  }

  // ensure id is unique
  let id;
  while (true) {
    id = nanoid();
    if (!(await db.get(id))) {
      await db.set(id, note);
      break;
    }
  }

  const noteUrl = `${request.get('host')}/${id}`;
  const block = `
    <h2>Note link ready</h2>
    <p>
      <a href="${id}" rel="noopener noreferrer" target="_blank">
        ${noteUrl}
      </a>
    </p>
    <p>
      <em>The note will self-destruct after reading it.</em>
    </p>
  `;

  response.send((await html) + block);
});

/**
 * GET /:id
 */
app.get('/:id', async (request, response, next) => {
  const { id } = request.params;

  if (!idRegex.test(id)) {
    return next();
  }

  const note = await db.get(id);

  if (!note) {
    return next();
  }

  await db.delete(id);

  const block = `
    <h2>Note contents</h2>
    <p>
      <strong>The note was destroyed. If you need to keep it, copy it before closing the window.</strong>
    </p>
    <textarea readonly>${note}</textarea>
  `;

  response.send((await html) + block);
});

// empty databse (development)
if (process.env.NODE_ENV === 'development') {
  app.get('/empty-database', async (request, response, next) => {
    await db.empty();
    response.send('Emptied Database');
  });
}

/**
 * 404
 */
app.use((request, response) => {
  response.status(404).send('Not Found');
});

/**
 * Error
 */
app.use((err, request, response, next) => {
  next(err);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Listening on port %d', port));
