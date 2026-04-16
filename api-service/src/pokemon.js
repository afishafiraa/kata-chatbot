const STOPWORDS = new Set([
  'a',
  'about',
  'detail',
  'details',
  'for',
  'give',
  'i',
  'information',
  'me',
  'of',
  'on',
  'please',
  'pokemon',
  'tell',
  'the'
]);

function titleCase(text) {
  return text
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeFlavorText(text) {
  return text.replace(/\f|\n|\r/g, ' ').replace(/\s+/g, ' ').trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function extractPokemonCandidates(query) {
  const lowered = String(query || '').toLowerCase().trim();
  const cleaned = lowered.replace(/[^a-z0-9\s-]/g, ' ');
  const words = cleaned.split(/\s+/).filter(Boolean);
  const remainingWords = words.filter((word) => !STOPWORDS.has(word));
  const candidates = [];

  const phrasePatterns = [
    /pokemon\s+([a-z0-9-]+)/,
    /about\s+([a-z0-9-]+)/,
    /detail(?:s)?(?:\s+of)?\s+([a-z0-9-]+)/,
    /information(?:\s+about|\s+of)?\s+([a-z0-9-]+)/
  ];

  for (const pattern of phrasePatterns) {
    const match = cleaned.match(pattern);
    if (match?.[1]) {
      candidates.push(match[1]);
    }
  }

  if (remainingWords.length > 0) {
    candidates.push(remainingWords.join('-'));
    candidates.push(remainingWords[remainingWords.length - 1]);
  }

  if (words.length > 0) {
    candidates.push(words[words.length - 1]);
  }

  return unique(candidates);
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function getPokemonByCandidate(candidate) {
  const pokemon = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${candidate}`);
  const species = await fetchJson(`https://pokeapi.co/api/v2/pokemon-species/${candidate}`);
  const evolutionChain = species.evolution_chain?.url
    ? await fetchJson(species.evolution_chain.url)
    : null;

  return { pokemon, species, evolutionChain };
}

function pickEnglishFlavorText(species) {
  return species.flavor_text_entries?.find(
    (entry) => entry.language?.name === 'en'
  )?.flavor_text;
}

function flattenEvolutionNames(chainNode, collected = []) {
  if (!chainNode) {
    return collected;
  }

  if (chainNode.species?.name) {
    collected.push(titleCase(chainNode.species.name));
  }

  for (const item of chainNode.evolves_to || []) {
    flattenEvolutionNames(item, collected);
  }

  return collected;
}

function formatPokemonMessage(detail) {
  const statsText = detail.stats.map((stat) => `${stat.name}: ${stat.value}`).join(', ');
  const abilitiesText = detail.abilities.join(', ');
  const typesText = detail.types.join(', ');
  const evolutionText = detail.evolutionChain.length > 0
    ? detail.evolutionChain.join(' -> ')
    : 'No evolution data';

  return [
    `Pokemon #${detail.id}: ${detail.name}`,
    `Types: ${typesText}`,
    `Abilities: ${abilitiesText}`,
    `Height: ${detail.heightMeters} m`,
    `Weight: ${detail.weightKg} kg`,
    `Base experience: ${detail.baseExperience}`,
    `Habitat: ${detail.habitat}`,
    `Generation: ${detail.generation}`,
    `Legendary: ${detail.isLegendary ? 'Yes' : 'No'}`,
    `Mythical: ${detail.isMythical ? 'Yes' : 'No'}`,
    `Stats: ${statsText}`,
    `Evolution chain: ${evolutionText}`,
    `Description: ${detail.description}`
  ].join('\n');
}

export async function getPokemonResponse(query) {
  const candidates = extractPokemonCandidates(query);

  for (const candidate of candidates) {
    try {
      const { pokemon, species, evolutionChain } = await getPokemonByCandidate(candidate);
      const flavorText = normalizeFlavorText(
        pickEnglishFlavorText(species) || 'No English description available.'
      );

      const detail = {
        id: pokemon.id,
        name: titleCase(pokemon.name),
        types: pokemon.types.map((item) => titleCase(item.type.name)),
        abilities: pokemon.abilities.map((item) => titleCase(item.ability.name)),
        heightMeters: pokemon.height / 10,
        weightKg: pokemon.weight / 10,
        baseExperience: pokemon.base_experience ?? 'Unknown',
        habitat: species.habitat ? titleCase(species.habitat.name) : 'Unknown',
        generation: species.generation ? titleCase(species.generation.name) : 'Unknown',
        isLegendary: Boolean(species.is_legendary),
        isMythical: Boolean(species.is_mythical),
        stats: pokemon.stats.map((item) => ({
          name: titleCase(item.stat.name),
          value: item.base_stat
        })),
        evolutionChain: unique(flattenEvolutionNames(evolutionChain?.chain)),
        description: flavorText
      };

      return {
        success: true,
        message: formatPokemonMessage(detail),
        data: detail
      };
    } catch (error) {
      if (error.status !== 404) {
        return {
          success: false,
          message: 'The Pokemon service is temporarily unavailable. Please try again.',
          error: error.message
        };
      }
    }
  }

  return {
    success: false,
    message: `I could not find a Pokemon from this query: "${query}". Try "pokemon pikachu" or "tell me about bulbasaur".`
  };
}
