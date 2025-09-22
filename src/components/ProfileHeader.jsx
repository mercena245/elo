import React from 'react';
import { Avatar, Typography, Box } from '@mui/material';
import { useAuthUser } from '../hooks/useAuthUser';

const ProfileHeader = () => {
  const user = useAuthUser();
  return (
    <Box display="flex" alignItems="center" gap={2} mb={2}>
      <Avatar src={user?.photoURL || ''} sx={{ width: 80, height: 80 }} />
      <Box>
        <Typography variant="h6">Olá, {user?.displayName || 'Usuário'}!</Typography>
        <Typography variant="body2" color="textSecondary">Escola Exemplo</Typography>
      </Box>
    </Box>
  );
};

export default ProfileHeader;
