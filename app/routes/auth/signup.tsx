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
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!username || !email || !password) {
    return { error: "All fields are required" };
  }

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existingUser) {
    return { error: "User already exists" };
  }

  // TODO: Use bcryptjs to hash password when package installation is fixed
  const passwordHash = password; // INSECURE: For demo only

  // Find default group or create one
  let group = await prisma.group.findFirst({ where: { default: true } });
  if (!group) {
    group = await prisma.group.create({
        data: { name: "Registered", default: true }
    });
  }

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: passwordHash,
      groupId: group.id,
    },
  });

  session.set("userId", user.id);

  return redirect("/", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export default function Signup() {
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
            Sign Up
          </Typography>

          <Form method="post">
            <Stack spacing={3}>
              {actionData?.error && (
                <Alert severity="error">{actionData.error}</Alert>
              )}

              <TextField
                label="Username"
                name="username"
                type="text"
                required
                fullWidth
                variant="outlined"
                autoComplete="username"
              />

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
                autoComplete="new-password"
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{ mt: 2 }}
              >
                Sign Up
              </Button>
            </Stack>
          </Form>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{" "}
              <Link
                to="/login"
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
                Login
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

