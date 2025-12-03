import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "react-router";
import { Form, useActionData, useLoaderData, useSubmit } from "react-router";
import { useState } from "react";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  Paper,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Avatar,
} from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import CommentIcon from "@mui/icons-material/Comment";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { prisma } from "../db.server";
import { getSession } from "../sessions";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  
  let user = null;
  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: { group: true }
    });
  }

  // Check if wordRequest model exists (in case Prisma client hasn't been regenerated)
  let requests: any[] = [];
  try {
    if (prisma.wordRequest) {
      requests = await prisma.wordRequest.findMany({
        include: {
          user: {
            select: { id: true, username: true }
          },
          votes: {
            include: {
              user: {
                select: { id: true }
              }
            }
          },
          comments: {
            include: {
              user: {
                select: { id: true, username: true }
              }
            },
            orderBy: { createdAt: "asc" }
          },
          approver: {
            select: { id: true, username: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });
    }
  } catch (error) {
    // Model doesn't exist yet - return empty array
    console.warn("WordRequest model not available. Please run: npx prisma generate && npx prisma migrate dev");
  }

  // Fetch all classifications
  const classifications = await prisma.classification.findMany({
    orderBy: { value: "asc" }
  });

  return { user, requests, isAdmin: user?.group?.admin || false, classifications };
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  
  if (!userId) {
    return { error: "You must be logged in to perform this action" };
  }

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "create") {
    if (!prisma.wordRequest) {
      return { error: "Database not ready. Please run: npx prisma generate && npx prisma migrate dev" };
    }

    const type = formData.get("type") as string;
    const trigedasleng = formData.get("trigedasleng") as string;
    const translation = formData.get("translation") as string;
    const classification = formData.get("classification") as string;
    const etymology = formData.get("etymology") as string;
    const source = formData.get("source") as string;

    if (!type || !trigedasleng || !translation) {
      return { error: "Type, Trigedasleng word, and translation are required" };
    }

    // Validate classification if provided
    if (classification) {
      const validClassification = await prisma.classification.findFirst({
        where: { value: classification }
      });
      if (!validClassification) {
        return { error: "Invalid classification. Please select from the dropdown." };
      }
    }

    await prisma.wordRequest.create({
      data: {
        userId,
        type,
        trigedasleng,
        translation,
        classification: classification || null,
        etymology: etymology || null,
        source: source || null,
      }
    });

    return { success: "Request created successfully" };
  }

  if (intent === "vote") {
    if (!prisma.vote || !prisma.wordRequest) {
      return { error: "Database not ready. Please run: npx prisma generate && npx prisma migrate dev" };
    }

    const requestId = formData.get("requestId") as string;
    const value = parseInt(formData.get("value") as string);

    if (!requestId || !value) {
      return { error: "Invalid vote data" };
    }

    // Check if user already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_requestId: {
          userId,
          requestId
        }
      }
    });

    if (existingVote) {
      if (existingVote.value === value) {
        // Remove vote if clicking same button
        await prisma.vote.delete({
          where: { id: existingVote.id }
        });
      } else {
        // Update vote
        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { value }
        });
      }
    } else {
      // Create new vote
      await prisma.vote.create({
        data: {
          userId,
          requestId,
          value
        }
      });
    }

    return { success: "Vote updated" };
  }

  if (intent === "comment") {
    if (!prisma.comment) {
      return { error: "Database not ready. Please run: npx prisma generate && npx prisma migrate dev" };
    }

    const requestId = formData.get("requestId") as string;
    const content = formData.get("content") as string;

    if (!requestId || !content) {
      return { error: "Comment content is required" };
    }

    await prisma.comment.create({
      data: {
        userId,
        requestId,
        content
      }
    });

    return { success: "Comment added" };
  }

  if (intent === "approve") {
    if (!prisma.wordRequest) {
      return { error: "Database not ready. Please run: npx prisma generate && npx prisma migrate dev" };
    }

    const requestId = formData.get("requestId") as string;
    const dictionaryType = formData.get("dictionaryType") as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { group: true }
    });

    if (!user || !user.group.admin) {
      return { error: "Unauthorized" };
    }

    const wordRequest = await prisma.wordRequest.findUnique({
      where: { id: requestId },
      include: { user: true }
    });

    if (!wordRequest) {
      return { error: "Request not found" };
    }

    // Map dictionary type
    let dictionaryValue = "Trigedasleng";
    if (dictionaryType === "slakgedasleng") {
      dictionaryValue = "Slakgedasleng";
    } else if (dictionaryType === "noncanon") {
      dictionaryValue = "Noncanon Trigedasleng";
    }

    // Find or create dictionary
    let dict = await prisma.dictionary.findFirst({
      where: { value: dictionaryValue }
    });

    if (!dict) {
      dict = await prisma.dictionary.create({
        data: { value: dictionaryValue }
      });
    }

    // Find or create classification
    let wordClass = null;
    if (wordRequest.classification) {
      wordClass = await prisma.classification.findFirst({
        where: { value: wordRequest.classification }
      });

      if (!wordClass) {
        wordClass = await prisma.classification.create({
          data: { value: wordRequest.classification }
        });
      }
    }

    // Create word
    const word = await prisma.word.create({
      data: {
        value: wordRequest.trigedasleng!,
        dictionaryId: dict.id,
        classifications: wordClass ? {
          create: {
            classificationId: wordClass.id
          }
        } : undefined,
      }
    });

    // Create translation to English
    let englishDict = await prisma.dictionary.findFirst({
      where: { value: "English" }
    });

    if (!englishDict) {
      englishDict = await prisma.dictionary.create({
        data: { value: "English" }
      });
    }

    let englishWord = await prisma.word.findFirst({
      where: {
        value: wordRequest.translation!,
        dictionaryId: englishDict.id
      }
    });

    if (!englishWord) {
      englishWord = await prisma.word.create({
        data: {
          value: wordRequest.translation!,
          dictionaryId: englishDict.id
        }
      });
    }

    await prisma.translation.create({
      data: {
        wordSourceId: word.id,
        wordTargetId: englishWord.id,
        etymology: wordRequest.etymology || null,
      }
    });

    // Update request status
    await prisma.wordRequest.update({
      where: { id: requestId },
      data: {
        status: "approved",
        approvedBy: userId,
        approvedAt: new Date(),
        dictionaryType
      }
    });

    return { success: "Request approved and word added" };
  }

  if (intent === "delete") {
    if (!prisma.wordRequest) {
      return { error: "Database not ready. Please run: npx prisma generate && npx prisma migrate dev" };
    }

    const requestId = formData.get("requestId") as string;

    if (!requestId) {
      return { error: "Request ID is required" };
    }

    const wordRequest = await prisma.wordRequest.findUnique({
      where: { id: requestId }
    });

    if (!wordRequest) {
      return { error: "Request not found" };
    }

    // Check if user is admin or the creator
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { group: true }
    });

    if (!user) {
      return { error: "User not found" };
    }

    const isAdmin = user.group.admin;
    const isCreator = wordRequest.userId === userId;

    if (!isAdmin && !isCreator) {
      return { error: "Unauthorized: Only admins or the request creator can delete requests" };
    }

    // Delete associated votes and comments first (cascade delete)
    await prisma.vote.deleteMany({
      where: { requestId }
    });

    await prisma.comment.deleteMany({
      where: { requestId }
    });

    // Delete the request
    await prisma.wordRequest.delete({
      where: { id: requestId }
    });

    return { success: "Request deleted successfully" };
  }

  return { error: "Invalid action" };
}

export default function Community() {
  const { user, requests, isAdmin, classifications } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const [openDialog, setOpenDialog] = useState(false);
  const [commentDialog, setCommentDialog] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [approveDialog, setApproveDialog] = useState<string | null>(null);
  const [dictionaryType, setDictionaryType] = useState("canon");

  const handleVote = (requestId: string, value: number) => {
    if (!user) {
      alert("Please log in to vote");
      return;
    }
    const formData = new FormData();
    formData.append("intent", "vote");
    formData.append("requestId", requestId);
    formData.append("value", value.toString());
    submit(formData, { method: "post" });
  };

  const handleComment = (requestId: string) => {
    if (!commentText.trim()) return;
    const formData = new FormData();
    formData.append("intent", "comment");
    formData.append("requestId", requestId);
    formData.append("content", commentText);
    submit(formData, { method: "post" });
    setCommentText("");
    setCommentDialog(null);
  };

  const handleApprove = (requestId: string) => {
    const formData = new FormData();
    formData.append("intent", "approve");
    formData.append("requestId", requestId);
    formData.append("dictionaryType", dictionaryType);
    submit(formData, { method: "post" });
    setApproveDialog(null);
    setDictionaryType("canon");
  };

  const handleDelete = (requestId: string) => {
    if (window.confirm("Are you sure you want to delete this request? This action cannot be undone.")) {
      const formData = new FormData();
      formData.append("intent", "delete");
      formData.append("requestId", requestId);
      submit(formData, { method: "post" });
    }
  };

  const getVoteCount = (request: any) => {
    return request.votes.reduce((sum: number, vote: any) => sum + vote.value, 0);
  };

  const getUserVote = (request: any) => {
    if (!user) return null;
    const vote = request.votes.find((v: any) => v.user.id === user.id);
    return vote ? vote.value : null;
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Community Requests
          </Typography>
          {user && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              New Request
            </Button>
          )}
        </Box>

        {actionData?.error && (
          <Alert severity="error" sx={{ mb: 2 }}>{actionData.error}</Alert>
        )}
        {actionData?.success && (
          <Alert severity="success" sx={{ mb: 2 }}>{actionData.success}</Alert>
        )}

        <Stack spacing={3}>
          {requests.map((request: any) => {
            const voteCount = getVoteCount(request);
            const userVote = getUserVote(request);
            const statusColor = 
              request.status === "approved" ? "success" :
              request.status === "rejected" ? "error" : "default";

            return (
              <Card key={request.id} elevation={2}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {request.trigedasleng} → {request.translation}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Requested by {request.user.username} • {new Date(request.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Chip label={request.status} color={statusColor} />
                  </Box>

                  {request.classification && (
                    <Chip label={request.classification} size="small" sx={{ mr: 1, mb: 1 }} />
                  )}
                  {request.etymology && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Etymology: {request.etymology}
                    </Typography>
                  )}
                  {request.source && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Source: <a href={request.source} target="_blank" rel="noreferrer">{request.source}</a>
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <IconButton
                        size="small"
                        color={userVote === 1 ? "primary" : "default"}
                        onClick={() => handleVote(request.id, 1)}
                        disabled={!user}
                      >
                        <ThumbUpIcon />
                      </IconButton>
                      <Typography variant="body2">{voteCount}</Typography>
                      <IconButton
                        size="small"
                        color={userVote === -1 ? "error" : "default"}
                        onClick={() => handleVote(request.id, -1)}
                        disabled={!user}
                      >
                        <ThumbDownIcon />
                      </IconButton>
                    </Box>
                    <Button
                      size="small"
                      startIcon={<CommentIcon />}
                      onClick={() => setCommentDialog(request.id)}
                    >
                      {request.comments.length} {request.comments.length === 1 ? "comment" : "comments"}
                    </Button>
                    {isAdmin && request.status === "pending" && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        onClick={() => setApproveDialog(request.id)}
                      >
                        Approve
                      </Button>
                    )}
                    {(isAdmin || (user && request.user.id === user.id)) && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(request.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </Box>

                  {request.comments.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      {request.comments.map((comment: any) => (
                        <Box key={comment.id} sx={{ mb: 1, pl: 2, borderLeft: "2px solid", borderColor: "divider" }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {comment.user.username}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {comment.content}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Stack>

        {requests.length === 0 && (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary">
              No requests yet. Be the first to request a word!
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Create Request Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request New Word</DialogTitle>
        <Form method="post">
          <DialogContent>
            <Stack spacing={2}>
              <input type="hidden" name="intent" value="create" />
              <input type="hidden" name="type" value="word" />
              <TextField
                label="Trigedasleng Word"
                name="trigedasleng"
                required
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Translation"
                name="translation"
                required
                fullWidth
                variant="outlined"
              />
              <FormControl fullWidth>
                <InputLabel>Classification (optional)</InputLabel>
                <Select
                  name="classification"
                  label="Classification (optional)"
                  defaultValue=""
                >
                  <MenuItem value="">None</MenuItem>
                  {classifications.map((classification) => (
                    <MenuItem key={classification.id} value={classification.value}>
                      {classification.value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Etymology (optional)"
                name="etymology"
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Source URL (optional)"
                name="source"
                fullWidth
                variant="outlined"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Submit</Button>
          </DialogActions>
        </Form>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={commentDialog !== null} onClose={() => setCommentDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextField
            label="Comment"
            multiline
            rows={4}
            fullWidth
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            variant="outlined"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => commentDialog && handleComment(commentDialog)}
            disabled={!commentText.trim()}
          >
            Post
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialog !== null} onClose={() => setApproveDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Request</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Dictionary Type</InputLabel>
            <Select
              value={dictionaryType}
              onChange={(e) => setDictionaryType(e.target.value)}
              label="Dictionary Type"
            >
              <MenuItem value="canon">Canon</MenuItem>
              <MenuItem value="slakgedasleng">Slakgedasleng</MenuItem>
              <MenuItem value="noncanon">Noncanon</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => approveDialog && handleApprove(approveDialog)}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

