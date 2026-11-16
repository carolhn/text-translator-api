import { createApp } from './app';

const port = Number(process.env.PORT ?? 3333);

createApp().listen(port, () => {
  console.log(`Api run in http://localhost:${port}`);
});
