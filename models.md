Google - imagen4-fast

const options = {
  method: 'POST',
  headers: {Authorization: 'Bearer <token>', 'Content-Type': 'application/json'},
  body: JSON.stringify({
    model: 'google/imagen4-fast',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {aspect_ratio: '16:9', num_images: '1'}
  })
};

fetch('https://api.kie.ai/api/v1/jobs/createTask', options)
  .then(res => res.json())
  .then(res => console.log(res))
  .catch(err => console.error(err));


Google - imagen4-ultra

  const options = {
  method: 'POST',
  headers: {Authorization: 'Bearer <token>', 'Content-Type': 'application/json'},
  body: JSON.stringify({
    model: 'google/imagen4-ultra',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {aspect_ratio: '1:1'}
  })
};

fetch('https://api.kie.ai/api/v1/jobs/createTask', options)
  .then(res => res.json())
  .then(res => console.log(res))
  .catch(err => console.error(err));



Google - imagen4

const options = {
  method: 'POST',
  headers: {Authorization: 'Bearer <token>', 'Content-Type': 'application/json'},
  body: JSON.stringify({
    model: 'google/imagen4',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {aspect_ratio: '1:1', num_images: '1'}
  })
};

fetch('https://api.kie.ai/api/v1/jobs/createTask', options)
  .then(res => res.json())
  .then(res => console.log(res))
  .catch(err => console.error(err));


  Google - Nano Banana Edit

  const options = {
  method: 'POST',
  headers: {Authorization: 'Bearer <token>', 'Content-Type': 'application/json'},
  body: JSON.stringify({
    model: 'google/nano-banana-edit',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {output_format: 'png', image_size: '1:1'}
  })
};

fetch('https://api.kie.ai/api/v1/jobs/createTask', options)
  .then(res => res.json())
  .then(res => console.log(res))
  .catch(err => console.error(err));



Google - Nano Banana

  const options = {
  method: 'POST',
  headers: {Authorization: 'Bearer <token>', 'Content-Type': 'application/json'},
  body: JSON.stringify({
    model: 'google/nano-banana',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {output_format: 'png', image_size: '1:1'}
  })
};

fetch('https://api.kie.ai/api/v1/jobs/createTask', options)
  .then(res => res.json())
  .then(res => console.log(res))
  .catch(err => console.error(err));


  Google - Nano Banana Pro

  const options = {
  method: 'POST',
  headers: {Authorization: 'Bearer <token>', 'Content-Type': 'application/json'},
  body: JSON.stringify({
    model: 'nano-banana-pro',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {aspect_ratio: '1:1', resolution: '1K', output_format: 'png'}
  })
};

fetch('https://api.kie.ai/api/v1/jobs/createTask', options)
  .then(res => res.json())
  .then(res => console.log(res))
  .catch(err => console.error(err));


Below are of flux:-
Flux-2 - Pro Image to Image
const options = {
  method: 'POST',
  headers: {Authorization: 'Bearer <token>', 'Content-Type': 'application/json'},
  body: JSON.stringify({
    model: 'flux-2/pro-image-to-image',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {aspect_ratio: '1:1', resolution: '1K'}
  })
};

fetch('https://api.kie.ai/api/v1/jobs/createTask', options)
  .then(res => res.json())
  .then(res => console.log(res))
  .catch(err => console.error(err));


Flux-2 - Pro Text to Image

const options = {
  method: 'POST',
  headers: {Authorization: 'Bearer <token>', 'Content-Type': 'application/json'},
  body: JSON.stringify({
    model: 'flux-2/pro-text-to-image',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {aspect_ratio: '1:1', resolution: '1K'}
  })
};

fetch('https://api.kie.ai/api/v1/jobs/createTask', options)
  .then(res => res.json())
  .then(res => console.log(res))
  .catch(err => console.error(err));


  Flux-2 - Image to Image

  const options = {
  method: 'POST',
  headers: {Authorization: 'Bearer <token>', 'Content-Type': 'application/json'},
  body: JSON.stringify({
    model: 'flux-2/flex-image-to-image',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {aspect_ratio: '1:1', resolution: '1K'}
  })
};

fetch('https://api.kie.ai/api/v1/jobs/createTask', options)
  .then(res => res.json())
  .then(res => console.log(res))
  .catch(err => console.error(err));


  Flux-2 - Text to Image

  const options = {
  method: 'POST',
  headers: {Authorization: 'Bearer <token>', 'Content-Type': 'application/json'},
  body: JSON.stringify({
    model: 'flux-2/flex-text-to-image',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {aspect_ratio: '1:1', resolution: '1K'}
  })
};

fetch('https://api.kie.ai/api/v1/jobs/createTask', options)
  .then(res => res.json())
  .then(res => console.log(res))
  .catch(err => console.error(err));



  Grok Imagine - Text to Image
  const options = {
  method: 'POST',
  headers: {Authorization: 'Bearer <token>', 'Content-Type': 'application/json'},
  body: JSON.stringify({
    model: 'grok-imagine/text-to-image',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      prompt: 'Cinematic portrait of a woman sitting by a vinyl record player, retro living room background, soft ambient lighting, warm earthy tones, nostalgic 1970s wardrobe, reflective mood, gentle film grain texture, shallow depth of field, vintage editorial photography style.',
      aspect_ratio: '3:2'
    }
  })
};

fetch('https://api.kie.ai/api/v1/jobs/createTask', options)
  .then(res => res.json())
  .then(res => console.log(res))
  .catch(err => console.error(err));


Qwen - Image to Image

  const options = {
  method: 'POST',
  headers: {Authorization: 'Bearer <token>', 'Content-Type': 'application/json'},
  body: JSON.stringify({
    model: 'qwen/image-to-image',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      strength: 0.8,
      output_format: 'png',
      acceleration: 'none',
      num_inference_steps: 30,
      guidance_scale: 2.5
    }
  })
};

fetch('https://api.kie.ai/api/v1/jobs/createTask', options)
  .then(res => res.json())
  .then(res => console.log(res))
  .catch(err => console.error(err));