const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const nunjucks = require('nunjucks');
const db = require('./database');
const { idRegex, nanoid } = require('./id');

const app = express();
app.use(morgan('dev'));
app.use(express.static('public'));

nunjucks.configure('views', {
  autoescape: true,
  express: app,
});

const urlencodedParser = bodyParser.urlencoded({ extended: false });

/**
 * GET /
 */
app.get('/', async (request, response) => {
  response.render('index.html');
});

/**
 * POST /
 */
app.post('/', urlencodedParser, async (request, response) => {
  const { note } = request.body;

  if (!note) {
    response.render('index.html');
    return;
  }

  // ensure note id is unique
  let noteId;
  while (true) {
    noteId = nanoid();
    if (!(await db.get(noteId))) {
      await db.set(noteId, note);
      break;
    }
  }

  const noteUrl = `${request.get('host')}/${noteId}`;
  response.render('index.html', { noteId, noteUrl });
});

/**
 * GET /:id
 */
app.get('/:id', async (request, response, next) => {
  const noteId = request.params.id;
  if (!idRegex.test(noteId)) {
    return next();
  }

  const note = await db.get(noteId);
  if (!note) {
    return next();
  }

  await db.delete(noteId);
  response.render('index.html', { note });
});

/**
 * GET /empty-database
 */
if (process.env.NODE_ENV === 'development') {
  app.get('/empty-database', async (request, response, next) => {
    await db.empty();
    response.render('index.html', { message: 'Emptied Database' });
  });
}

/**
 * 404
 */
app.use((request, response) => {
  response.status(404).render('index.html', { message: 'Not Found' });
});

/**
 * Error
 */
app.use((error, request, response, next) => {
  next(error);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Listening on port %d', port));
