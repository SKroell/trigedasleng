import React from 'react';
import { Link } from 'react-router';
import { Card, CardContent, Typography, Link as MuiLink, Chip, Box } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

export default function Word({ word }: { word: any }) {
	const isNoncanon = (word.filter || "").includes('noncanon');
	const wordValue = word.word || word.value;
	
	// Parse translation to extract classification and definition
	// Format: "classification: definition" or just "definition"
	let classification = "";
	let definition = word.translation || "";
	
	if (word.translation && word.translation.includes(":")) {
		const parts = word.translation.split(":");
		classification = parts[0].trim();
		definition = parts.slice(1).join(":").trim();
	}

	return (
		<Card
			sx={{
				mb: 2,
				transition: 'all 0.2s ease-in-out',
				'&:hover': {
					boxShadow: 4,
					transform: 'translateY(-2px)',
				},
			}}
		>
			<CardContent>
				{/* Word with dotted underline */}
				<Box sx={{ mb: 1 }}>
					<Typography
						variant="h5"
						component="h3"
						sx={{
							fontWeight: 600,
							borderBottom: '1px dotted',
							borderColor: 'text.primary',
							pb: 0.5,
							display: 'inline-block',
						}}
					>
						<MuiLink
							component={Link}
							to={"/word/" + wordValue}
							sx={{
								textDecoration: 'none',
								color: 'text.primary',
								'&:hover': {
									textDecoration: 'underline',
								},
							}}
						>
							{wordValue}
						</MuiLink>
					</Typography>
					{/* Pronunciation */}
					{word.pronunciation && (
						<Typography
							variant="body2"
							sx={{
								color: 'text.secondary',
								fontStyle: 'italic',
								mt: 0.5,
								ml: 1,
							}}
						>
							[{word.pronunciation}]
						</Typography>
					)}
				</Box>

				{/* Classification and definition */}
				{definition && (
					<Typography
						variant="body1"
						sx={{
							color: 'text.secondary',
							mb: word.etymology ? 1 : 0,
						}}
					>
						{classification && (
							<Box component="span" sx={{ fontWeight: 500 }}>
								{classification}:
							</Box>
						)}{' '}
						{definition}
					</Typography>
				)}

				{/* Etymology */}
				{word.etymology && (
					<Typography
						variant="body2"
						sx={{
							color: 'text.secondary',
							mt: 1,
						}}
					>
						{word.etymology.startsWith('from:') ? word.etymology : `from: ${word.etymology}`}
					</Typography>
				)}

				{/* Non-canon warning */}
				{isNoncanon && (
					<Typography
						variant="body2"
						sx={{
							color: 'error.main',
							fontStyle: 'italic',
							mt: 1,
							fontWeight: 500,
						}}
					>
						!!Not a canon word
					</Typography>
				)}
			</CardContent>
		</Card>
	);
}