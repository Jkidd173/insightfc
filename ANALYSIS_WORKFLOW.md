# InsightFC Match Analysis Workflow

## Product flow
Upload Game -> Process & Review -> Verified Stats & Highlights

The UI must not imply that automated computer vision is active until a real inference pipeline is connected. Detected actions should be coach-reviewable before publication.

## Event definitions

### Carry
A player in possession advances/dribbles with the ball for **10 yards or more**.

Suggested stored fields:
- start timestamp / end timestamp
- start position / end position
- distance yards
- player id
- confidence
- verification status

### Take-on
A **deliberate attempt by a player in possession to beat one or more opponents in a one-on-one**.

Outcome:
- Successful: opponent is beaten and the player retains/advances possession.
- Unsuccessful: the defender stops the attempt or possession is lost as a direct result.

Carry and Take-on are independent labels. One continuous sequence may contain both.

## Initial coach-facing outputs
- tracked actions
- passes and completion
- carries (10+ yards)
- carry distance when available
- take-ons attempted / successful / success percentage
- shots
- recoveries
- turnovers
- defensive actions
- timestamped action timeline
- source-video event clips
- verified player match stats
- personal and team highlights

## Integration seam
A future CV/inference service should output timestamped candidate events. InsightFC should store candidate confidence separately from coach verification and published statistics.
