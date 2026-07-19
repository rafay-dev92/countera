// fetchUser decodes the JWT and attaches the payload's user to the request.
declare global {
  namespace Express {
    interface Request {
      user: { id: string };
    }
  }
}

export {};
