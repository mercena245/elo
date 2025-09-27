import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  IconButton,
  Collapse,
  Tooltip
} from "@mui/material";
import { ExpandMore, ExpandLess, MenuBook } from "@mui/icons-material";
import { FaChalkboardTeacher } from "react-icons/fa";

export default function GestaoEscolarCard({ turmasContent, periodosContent, disciplinasContent, gradeHorariaContent, notasFrequenciaContent }) {
  const [openTurmas, setOpenTurmas] = useState(false);
  const [openPeriodos, setOpenPeriodos] = useState(false);
  const [openDisciplinas, setOpenDisciplinas] = useState(false);
  const [openGradeHoraria, setOpenGradeHoraria] = useState(false);
  const [openNotasFrequencia, setOpenNotasFrequencia] = useState(false);

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6" color="primary" fontWeight={700} sx={{ mb: 2 }}>
          Gestão Escolar
        </Typography>
        {/* Turmas */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            cursor: 'pointer',
            mb: 1,
            borderRadius: 2,
            px: 1.5,
            py: 1,
            transition: 'background 0.2s',
            bgcolor: openTurmas ? '#e1f5fe' : 'transparent',
            '&:hover': {
              bgcolor: '#b3e5fc',
              boxShadow: 2
            }
          }}
          onClick={() => setOpenTurmas(v => !v)}
        >
          <Avatar sx={{ bgcolor: openTurmas ? '#01579b' : '#1976d2', transition: 'background 0.2s' }}>
            <FaChalkboardTeacher />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700, color: openTurmas ? '#01579b' : '#1976d2', transition: 'color 0.2s' }}>
            Turmas
          </Typography>
          <Tooltip title={openTurmas ? 'Recolher' : 'Expandir'}>
            <IconButton size="small" sx={{ color: openTurmas ? '#01579b' : '#1976d2' }}>
              {openTurmas ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Tooltip>
        </Box>
        <Collapse in={openTurmas} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2 }}>{turmasContent}</Box>
        </Collapse>
        {/* Períodos */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            cursor: 'pointer',
            mb: 1,
            borderRadius: 2,
            px: 1.5,
            py: 1,
            transition: 'background 0.2s',
            bgcolor: openPeriodos ? '#ede7f6' : 'transparent',
            '&:hover': {
              bgcolor: '#d1c4e9',
              boxShadow: 2
            }
          }}
          onClick={() => setOpenPeriodos(v => !v)}
        >
          <Avatar sx={{ bgcolor: openPeriodos ? '#4a148c' : '#7b1fa2', transition: 'background 0.2s' }}>
            <Typography fontWeight={700} color="white">P</Typography>
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700, color: openPeriodos ? '#4a148c' : '#7b1fa2', transition: 'color 0.2s' }}>
            Períodos
          </Typography>
          <Tooltip title={openPeriodos ? 'Recolher' : 'Expandir'}>
            <IconButton size="small" sx={{ color: openPeriodos ? '#4a148c' : '#7b1fa2' }}>
              {openPeriodos ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Tooltip>
        </Box>
        <Collapse in={openPeriodos} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2 }}>{periodosContent}</Box>
        </Collapse>
        {/* Disciplinas */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            cursor: 'pointer',
            mb: 1,
            borderRadius: 2,
            px: 1.5,
            py: 1,
            transition: 'background 0.2s',
            bgcolor: openDisciplinas ? '#e1f5fe' : 'transparent',
            '&:hover': {
              bgcolor: '#b3e5fc',
              boxShadow: 2
            }
          }}
          onClick={() => setOpenDisciplinas(v => !v)}
        >
          <Avatar sx={{ bgcolor: openDisciplinas ? '#01579b' : '#0288d1', transition: 'background 0.2s' }}>
            <MenuBook />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700, color: openDisciplinas ? '#01579b' : '#0288d1', transition: 'color 0.2s' }}>
            Disciplinas
          </Typography>
          <Tooltip title={openDisciplinas ? 'Recolher' : 'Expandir'}>
            <IconButton size="small" sx={{ color: openDisciplinas ? '#01579b' : '#0288d1' }}>
              {openDisciplinas ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Tooltip>
        </Box>
        <Collapse in={openDisciplinas} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2 }}>{disciplinasContent}</Box>
        </Collapse>
        {/* Grade Horária */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            cursor: 'pointer',
            mb: 1,
            borderRadius: 2,
            px: 1.5,
            py: 1,
            transition: 'background 0.2s',
            bgcolor: openGradeHoraria ? '#f3e5f5' : 'transparent',
            '&:hover': {
              bgcolor: '#e1bee7',
              boxShadow: 2
            }
          }}
          onClick={() => setOpenGradeHoraria(v => !v)}
        >
          <Avatar sx={{ bgcolor: openGradeHoraria ? '#6a1b9a' : '#8e24aa', transition: 'background 0.2s' }}>
            <Typography fontWeight={700} color="white">📅</Typography>
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700, color: openGradeHoraria ? '#6a1b9a' : '#8e24aa', transition: 'color 0.2s' }}>
            Grade Horária
          </Typography>
          <Tooltip title={openGradeHoraria ? 'Recolher' : 'Expandir'}>
            <IconButton size="small" sx={{ color: openGradeHoraria ? '#6a1b9a' : '#8e24aa' }}>
              {openGradeHoraria ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Tooltip>
        </Box>
        <Collapse in={openGradeHoraria} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2 }}>{gradeHorariaContent}</Box>
        </Collapse>

        {/* Notas & Frequência */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            cursor: 'pointer',
            mb: 1,
            borderRadius: 2,
            px: 1.5,
            py: 1,
            transition: 'background 0.2s',
            bgcolor: openNotasFrequencia ? '#f3e5f5' : 'transparent',
            '&:hover': {
              bgcolor: '#e1bee7',
              boxShadow: 2
            }
          }}
          onClick={() => setOpenNotasFrequencia(v => !v)}
        >
          <Avatar sx={{ bgcolor: openNotasFrequencia ? '#6a1b9a' : '#9c27b0', transition: 'background 0.2s' }}>
            📊
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700, color: openNotasFrequencia ? '#6a1b9a' : '#9c27b0', transition: 'color 0.2s' }}>
            Notas & Frequência
          </Typography>
          <Tooltip title={openNotasFrequencia ? 'Recolher' : 'Expandir'}>
            <IconButton size="small" sx={{ color: openNotasFrequencia ? '#6a1b9a' : '#9c27b0' }}>
              {openNotasFrequencia ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Tooltip>
        </Box>
        <Collapse in={openNotasFrequencia} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2 }}>{notasFrequenciaContent}</Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}
