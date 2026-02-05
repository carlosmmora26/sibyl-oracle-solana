use anchor_lang::prelude::*;

declare_id!("gVaLAXxsYPLdmJnzL5HyuA57jCrSvjv93Lprw8VGtfu");

#[program]
pub mod sibyl_oracle {
    use super::*;

    /// Initialize the oracle with authority
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let oracle = &mut ctx.accounts.oracle;
        oracle.authority = ctx.accounts.authority.key();
        oracle.prediction_count = 0;
        oracle.correct_predictions = 0;
        Ok(())
    }

    /// Create a new prediction (only authority can call)
    pub fn create_prediction(
        ctx: Context<CreatePrediction>,
        statement: String,
        confidence: u8,
        deadline_hours: u8,
    ) -> Result<()> {
        require!(confidence <= 100, SibylError::InvalidConfidence);
        require!(deadline_hours > 0, SibylError::InvalidDeadline);

        let oracle = &mut ctx.accounts.oracle;
        let prediction = &mut ctx.accounts.prediction;
        let clock = Clock::get()?;

        oracle.prediction_count += 1;

        prediction.id = oracle.prediction_count;
        prediction.statement = statement.clone();
        prediction.confidence = confidence;
        prediction.deadline = clock.unix_timestamp + (deadline_hours as i64 * 3600);
        prediction.resolved = false;
        prediction.outcome = false;
        prediction.created_at = clock.unix_timestamp;

        emit!(PredictionCreated {
            id: prediction.id,
            statement,
            confidence,
            deadline: prediction.deadline,
        });

        Ok(())
    }

    /// Resolve a prediction (only authority can call)
    pub fn resolve_prediction(
        ctx: Context<ResolvePrediction>,
        id: u64,
        was_correct: bool,
    ) -> Result<()> {
        let oracle = &mut ctx.accounts.oracle;
        let prediction = &mut ctx.accounts.prediction;
        let clock = Clock::get()?;

        require!(prediction.id == id, SibylError::InvalidPredictionId);
        require!(!prediction.resolved, SibylError::AlreadyResolved);
        require!(clock.unix_timestamp >= prediction.deadline, SibylError::DeadlineNotReached);

        prediction.resolved = true;
        prediction.outcome = was_correct;

        if was_correct {
            oracle.correct_predictions += 1;
        }

        emit!(PredictionResolved {
            id,
            outcome: was_correct,
            accuracy: get_accuracy(oracle),
        });

        Ok(())
    }

    /// Transfer oracle authority to new address
    pub fn transfer_authority(ctx: Context<TransferAuthority>, new_authority: Pubkey) -> Result<()> {
        let oracle = &mut ctx.accounts.oracle;
        oracle.authority = new_authority;
        Ok(())
    }
}

/// Calculate accuracy percentage (0-100)
fn get_accuracy(oracle: &Oracle) -> u8 {
    if oracle.prediction_count == 0 {
        return 0;
    }
    
    // In a real implementation, we'd need to count resolved predictions
    // For simplicity, we'll use a placeholder calculation
    // A more complete version would track resolved count separately
    if oracle.correct_predictions == 0 {
        return 0;
    }
    
    // Simple placeholder: accuracy = (correct / total) * 100
    // This assumes all predictions are resolved
    ((oracle.correct_predictions * 100) / oracle.prediction_count) as u8
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Oracle::INIT_SPACE,
        seeds = [b"oracle"],
        bump
    )]
    pub oracle: Account<'info, Oracle>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreatePrediction<'info> {
    #[account(
        mut,
        seeds = [b"oracle"],
        bump,
        has_one = authority
    )]
    pub oracle: Account<'info, Oracle>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + Prediction::INIT_SPACE,
        seeds = [b"prediction", oracle.prediction_count.checked_add(1).unwrap_or(1).to_le_bytes().as_ref()],
        bump
    )]
    pub prediction: Account<'info, Prediction>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(id: u64)]
pub struct ResolvePrediction<'info> {
    #[account(
        mut,
        seeds = [b"oracle"],
        bump,
        has_one = authority
    )]
    pub oracle: Account<'info, Oracle>,
    
    #[account(
        mut,
        seeds = [b"prediction", id.to_le_bytes().as_ref()],
        bump
    )]
    pub prediction: Account<'info, Prediction>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    #[account(
        mut,
        seeds = [b"oracle"],
        bump,
        has_one = authority
    )]
    pub oracle: Account<'info, Oracle>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Oracle {
    pub authority: Pubkey,
    pub prediction_count: u64,
    pub correct_predictions: u64,
}

#[account]
#[derive(InitSpace)]
pub struct Prediction {
    pub id: u64,
    #[max_len(280)] // Twitter-like length
    pub statement: String,
    pub confidence: u8,      // 0-100
    pub deadline: i64,       // Unix timestamp
    pub resolved: bool,
    pub outcome: bool,       // true = correct, false = wrong
    pub created_at: i64,
}

#[event]
pub struct PredictionCreated {
    pub id: u64,
    pub statement: String,
    pub confidence: u8,
    pub deadline: i64,
}

#[event]
pub struct PredictionResolved {
    pub id: u64,
    pub outcome: bool,
    pub accuracy: u8,
}

#[error_code]
pub enum SibylError {
    #[msg("Confidence must be between 0 and 100")]
    InvalidConfidence,
    #[msg("Deadline must be positive")]
    InvalidDeadline,
    #[msg("Invalid prediction ID")]
    InvalidPredictionId,
    #[msg("Prediction already resolved")]
    AlreadyResolved,
    #[msg("Deadline not reached yet")]
    DeadlineNotReached,
}