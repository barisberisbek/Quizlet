import { createHashRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { HomePage } from '../pages/HomePage';
import { QuizPage } from '../pages/QuizPage';
import { StatsPage } from '../pages/StatsPage';
import { BookmarksPage } from '../pages/BookmarksPage';
import { NotFoundPage } from '../pages/NotFoundPage';

/**
 * Hash router for GitHub Pages compatibility.
 * 
 * URLs will look like:
 *   /#/
 *   /#/quiz/dwp-2024-midterm
 *   /#/stats
 *   /#/bookmarks
 * 
 * This avoids the need for 404.html redirect hacks on GitHub Pages.
 */
const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'quiz/:quizId',
        element: <QuizPage />,
      },
      {
        path: 'stats',
        element: <StatsPage />,
      },
      {
        path: 'bookmarks',
        element: <BookmarksPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
