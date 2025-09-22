"use client";
import React from 'react';
import { Box, Grid, Card, CardContent, Typography, Badge, IconButton, Avatar, Paper, Button, Container } from '@mui/material';
import ProfileHeader from '../../components/ProfileHeader';
import SidebarMenu from '../../components/SidebarMenu';
import { FaCalendarAlt, FaEnvelope, FaHeadset, FaChevronRight } from 'react-icons/fa';
import '../../styles/Profile.css';

const Profile = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#e3f2fd', display: 'flex' }}>
      <SidebarMenu />
      <Container maxWidth="md" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: { xs: 2, md: 4 }, px: { xs: 1, md: 3 }, flex: 1 }}>
        <Box width="100%" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
          <ProfileHeader />
          {/* Menu de navegação principal */}
          <Grid container spacing={2} mb={3} justifyContent="center">
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: '#e3f2fd' }}>
                <CardContent style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                  <FaCalendarAlt size={32} color="#1976d2" />
                  <Typography variant="h6">Agenda</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: '#ede7f6', position: 'relative' }}>
                <CardContent style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                  <Badge badgeContent={3} color="error" sx={{ mr: 1 }}>
                    <FaEnvelope size={32} color="#7c4dff" />
                  </Badge>
                  <Typography variant="h6">Comunicados</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: '#ffebee' }}>
                <CardContent style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                  <FaHeadset size={32} color="#d81b60" />
                  <Typography variant="h6">Atendimentos</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box display="flex" flexDirection="column" alignItems="center" width="100%" gap={3}>
            {/* Comunicados não lidos */}
              <Box width="100%" maxWidth={600}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle1">Comunicados não lidos <Badge badgeContent={3} color="error" /></Typography>
                  <IconButton><FaChevronRight /></IconButton>
                </Box>
                <Grid container spacing={2}>
                  {[{date:'19/09',title:'Reunião de pais',preview:'A reunião será...'}, {date:'18/09',title:'Feriado',preview:'Não haverá aula...'}].map((c, i) => (
                    <Grid item xs={12} key={i}>
                      <Card>
                        <CardContent>
                          <Typography variant="caption" color="textSecondary">{c.date}</Typography>
                          <Typography variant="subtitle2">{c.title}</Typography>
                          <Typography variant="body2">{c.preview}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Box width="100%" maxWidth={600}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1} mt={3}>
                  <Typography variant="subtitle1">Próximos eventos</Typography>
                  <IconButton><FaChevronRight /></IconButton>
                </Box>
                <Grid container spacing={2}>
                  {[{date:'25/09',info:'Reunião de pais às 19h'}, {date:'07/10',info:'Feriado municipal'}].map((e, i) => (
                    <Grid item xs={12} key={i}>
                      <Card>
                        <CardContent>
                          <Typography variant="caption" color="textSecondary">{e.date}</Typography>
                          <Typography variant="body2">{e.info}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Box width="100%" maxWidth={600}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1} mt={3}>
                  <Typography variant="subtitle1">Solicitações abertas</Typography>
                  <IconButton><FaChevronRight /></IconButton>
                </Box>
                <Card>
                  <CardContent>
                    <Typography variant="body2">Você possui 2 solicitações pendentes.</Typography>
                  </CardContent>
                </Card>
              </Box>

              <Box width="100%" maxWidth={600} mt={3}>
                <Card sx={{ bgcolor: '#e0f7fa', display: 'flex', alignItems: 'center', p: 2, justifyContent: 'center' }}>
                  <Avatar sx={{ bgcolor: '#00bcd4', width: 56, height: 56, mr: 2 }}>60a</Avatar>
                  <Box>
                    <Typography variant="h6">Tudo em dia em Agenda</Typography>
                    <Typography variant="body2" color="textSecondary">Nenhuma pendência encontrada</Typography>
                  </Box>
                </Card>
              </Box>

            {/* Próximos eventos */}
            <Box width="100%" maxWidth={600} mx="auto">
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1} mt={3}>
                <Typography variant="subtitle1">Próximos eventos</Typography>
                <IconButton><FaChevronRight /></IconButton>
              </Box>
              <Grid container spacing={2} justifyContent="center">
                {[{date:'25/09',info:'Reunião de pais às 19h'}, {date:'07/10',info:'Feriado municipal'}].map((e, i) => (
                  <Grid item xs={12} sm={6} key={i} display="flex" justifyContent="center">
                    <Card sx={{ width: '100%', maxWidth: 250, mx: 'auto' }}>
                      <CardContent>
                        <Typography variant="caption" color="textSecondary">{e.date}</Typography>
                        <Typography variant="body2">{e.info}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Solicitações abertas */}
            <Grid container spacing={2} mb={3} justifyContent="center">
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: '#e0f7fa', display: 'flex', alignItems: 'center', p: 2, justifyContent: 'center' }}>
                  <Avatar sx={{ bgcolor: '#00bcd4', width: 56, height: 56, mr: 2 }}>60a</Avatar>
                  <Box>
                    <Typography variant="h6">Tudo em dia em Agenda</Typography>
                    <Typography variant="body2" color="textSecondary">Nenhuma pendência encontrada</Typography>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box mb={2}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="subtitle1">Solicitações abertas</Typography>
                    <IconButton><FaChevronRight /></IconButton>
                  </Box>
                  <Card>
                    <CardContent>
                      <Typography variant="body2">Você possui 2 solicitações pendentes.</Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            </Grid>

            {/* Informativo da agenda */}
            <Box width="100%" maxWidth={600} mt={3} mx="auto">
              <Card sx={{ bgcolor: '#e0f7fa', display: 'flex', alignItems: 'center', p: 2, justifyContent: 'center', mx: 'auto', width: '100%', maxWidth: 400 }}>
                <Avatar sx={{ bgcolor: '#00bcd4', width: 56, height: 56, mr: 2 }}>60a</Avatar>
                <Box>
                  <Typography variant="h6">Tudo em dia em Agenda</Typography>
                  <Typography variant="body2" color="textSecondary">Nenhuma pendência encontrada</Typography>
                </Box>
              </Card>
            </Box>
          </Box>
        </Box>
      </Container>
    </div>
  );
};

export default Profile;
