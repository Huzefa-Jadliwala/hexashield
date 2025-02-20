import React from "react";
import { Grid, Box } from "@mui/material";
import Vision from "./Vision";
import Mission from "./Mission";
import Purpose from "./Purpose";

const CompanyValues: React.FC = () => {
    return (
        <Box sx={{ flexGrow: 1, p: 2 }}>
            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <Vision />
                </Grid>
                <Grid item xs={12} md={4}>
                    <Mission />
                </Grid>
                <Grid item xs={12} md={4}>
                    <Purpose />
                </Grid>
            </Grid>
        </Box>
    );
};

export default CompanyValues;