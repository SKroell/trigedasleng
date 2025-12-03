import { type ActionFunctionArgs, redirect } from "react-router";
import { Form, Link, useActionData } from "react-router";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Stack,
} from "@mui/material";
import { prisma } from "../../db.server";
import { commitSession, getSession } from "../../sessions";

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  // TODO: Use bcryptjs to compare hash
  // const isValid = await bcrypt.compare(password, user.password);
  const isValid = user && user.password === password;

  if (!user || !isValid) {
    return { error: "Invalid email or password" };
  }

  session.set("userId", user.id);

  return redirect("/", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export default function Login() {
  const actionData = useActionData<typeof action>();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: "100%",
            maxWidth: 400,
          }}
        >
          <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 600, textAlign: "center" }}>
            Login
          </Typography>

          <Form method="post">
            <Stack spacing={3}>
              {actionData?.error && (
                <Alert severity="error">{actionData.error}</Alert>
              )}

              <TextField
                label="Email"
                name="email"
                type="email"
                required
                fullWidth
                variant="outlined"
                autoComplete="email"
              />

              <TextField
                label="Password"
                name="password"
                type="password"
                required
                fullWidth
                variant="outlined"
                autoComplete="current-password"
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{ mt: 2 }}
              >
                Login
              </Button>
            </Stack>
          </Form>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{" "}
              <Link
                to="/signup"
                style={{
                  color: "#1976d2",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = "underline";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = "none";
                }}
              >
                Sign Up
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

