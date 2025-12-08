import React, { useState, useEffect } from 'react';
import { useLoaderData } from "react-router";
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  IconButton,
  Button,
} from '@mui/material';
import FlipIcon from '@mui/icons-material/Flip';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Word from "../components/Word";
import { prisma } from "../db.server";

export async function loader() {
    const dictionary = await prisma.word.findMany({
        include: {
            classifications: {
                include: { classification: true }
            },
            translationsFrom: {
                include: { wordTarget: true }
            }
        }
    });

    const mappedDictionary = dictionary.map(w => ({
        id: w.id,
        word: w.value,
        pronunciation: w.pronunciation,
        translation: w.translationsFrom.map(t => t.wordTarget.value).join(', '),
        filter: w.classifications.map(c => c.classification.value).join(" "),
        classifications: w.classifications.map(c => c.classification.value)
    }));

    return { dictionary: mappedDictionary };
}

function FlashCard({ frontContent, backContent, onNext }: { frontContent: string; backContent: React.ReactNode; onNext: () => void }) {
    const [showAnswer, setShowAnswer] = useState(false);

    const handleFlip = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        setShowAnswer(!showAnswer);
    };

    return (
        <Card
            sx={{
                width: { xs: '100%', sm: '30em' },
                height: '15em',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                cursor: 'pointer',
                transition: 'transform 0.3s',
                '&:hover': {
                    boxShadow: 6,
                },
                mb: 3,
            }}
            onClick={() => handleFlip()}
        >
            <IconButton
                sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                }}
                onClick={(e) => handleFlip(e)}
            >
                <FlipIcon />
            </IconButton>
            <CardContent sx={{ textAlign: 'center', width: '100%' }}>
                {showAnswer ? (
                    <Box>
                        {backContent}
                        <Box sx={{ mt: 2, opacity: showAnswer ? 1 : 0, transition: 'opacity 0.3s' }}>
                            <Button
                                variant="contained"
                                endIcon={<NavigateNextIcon />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAnswer(false);
                                    onNext();
                                }}
                            >
                                Next
                            </Button>
                        </Box>
                    </Box>
                ) : (
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        {frontContent}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}

function CardContainer({ dictionary }: { dictionary: any[] }) {
    const [cardNumber, setCardNumber] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (cardNumber === undefined && dictionary.length > 0) {
            showNextCard();
        }
    }, [dictionary.length]);

    const showNextCard = () => {
        setCardNumber(Math.floor(Math.random() * dictionary.length));
    };

    if (cardNumber === undefined || dictionary.length === 0) {
        return <Typography>Loading...</Typography>;
    }

    const randomWord = dictionary[cardNumber];
    return (
        <FlashCard
            frontContent={randomWord.word}
            backContent={<Word word={randomWord} />}
            onNext={showNextCard}
        />
    );
}

export default function Learn() {
    const { dictionary } = useLoaderData<typeof loader>();

    const groups = [
        "all",
        "noun",
        "pronoun",
        "verb",
        "adverb",
        "adjective",
        "conjunction",
        "preposition",
        "interjection",
        "auxiliary"
    ];

    const generateCardContainers = () => {
        return groups.map(group => {
            let words = dictionary.filter((entry: any) => {
                return (group === "all" || entry.classifications.includes(group));
            });
            
            if (words.length === 0) return null;

            return (
                <Grid item xs={12} sm={12} md={6} key={group}>
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase' }}>
                        {group}
                    </Typography>
                    <CardContainer dictionary={words} />
                </Grid>
            );
        }).filter(Boolean);
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: { xs: 2, sm: 3 } }}>
                <Typography variant="h3" component="h1" sx={{ mb: 4, fontWeight: 600 }}>
                    Learn Trigedasleng
                </Typography>
                <Grid container spacing={3}>
                    {generateCardContainers()}
                </Grid>
            </Box>
        </Container>
    );
}
