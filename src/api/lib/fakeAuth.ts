
const DEMO_DELAY_MS = 1500;

function waitForDemo(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, DEMO_DELAY_MS);
  });
}

// TODO: replace with Supabase later
export async function login(
  email: string,
  password: string,
): Promise<{ email: string }> {
  await waitForDemo();

  if (password === 'wrong123') {
    throw new Error('Wrong password');
  }

  return { email: email.trim().toLowerCase() };
}

// TODO: replace with Supabase later
export async function signup(
  email: string,
  password: string,
): Promise<{ email: string }> {
  await waitForDemo();

  if (password === 'wrong123') {
    throw new Error('Wrong password');
  }

  return { email: email.trim().toLowerCase() };
}
