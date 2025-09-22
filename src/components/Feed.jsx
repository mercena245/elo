import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

const feedData = [
  { id: 1, title: 'Reunião de pais', content: 'A reunião de pais será realizada no dia 25/09 às 19h.' },
  { id: 2, title: 'Novo projeto', content: 'Os alunos do 3º ano iniciaram o projeto de robótica.' },
  { id: 3, title: 'Feriado escolar', content: 'Não haverá aula no dia 7 de outubro devido ao feriado municipal.' },
];

const Feed = () => {
  return (
    <div style={{ maxWidth: 600, margin: '32px auto', width: '100%' }}>
      {feedData.map(item => (
        <Card key={item.id} style={{ marginBottom: 16 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>{item.title}</Typography>
            <Typography variant="body2">{item.content}</Typography>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Feed;
